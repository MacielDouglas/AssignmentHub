import type { CleaningType } from "@/generated/prisma/enums";
import type {
	CleaningCandidatePerson,
	CleaningGeneratedAssignmentCell,
	CleaningGeneratedAssignmentRow,
	CleaningGenerationResult,
	CleaningSectorRule,
	CleaningTypeConfigView,
} from "../domain/cleaning-list.types";
import type { RotationEntry } from "./get-cleaning-rotation-map";

type GenerateInput = {
	cleaningType: CleaningType;
	periodFrom: Date;
	periodTo: Date;
	dates: Date[];
	config: CleaningTypeConfigView;
	people: CleaningCandidatePerson[];
	rotationMap: Map<string, RotationEntry>;
};

type AssignSectorInput = {
	sector: CleaningSectorRule;
	people: CleaningCandidatePerson[];
	usedPersonIds: Set<string>;
	rollingRotationMap: Map<string, RotationEntry>;
	assignmentMode: CleaningTypeConfigView["assignmentMode"];
	warnings: string[];
	currentDate: Date;
};

export function autoAssignCleaning({
	cleaningType,
	periodFrom,
	periodTo,
	dates,
	config,
	people,
	rotationMap,
}: GenerateInput): CleaningGenerationResult {
	const warnings: string[] = [];
	const rows: CleaningGeneratedAssignmentRow[] = [];

	const rollingRotationMap = new Map(rotationMap);

	for (const date of dates) {
		const usedPersonIds = new Set<string>();

		const cells = config.sectors
			.filter((sector) => sector.isActive)
			.sort((a, b) => a.sortOrder - b.sortOrder)
			.map((sector) =>
				assignSector({
					sector,
					people,
					usedPersonIds,
					rollingRotationMap,
					assignmentMode: config.assignmentMode,
					warnings,
					currentDate: date,
				}),
			);

		rows.push({
			date,
			cells,
		});
	}

	return {
		cleaningType,
		periodFrom,
		periodTo,
		rows,
		warnings,
	};
}

function assignSector({
	sector,
	people,
	usedPersonIds,
	rollingRotationMap,
	assignmentMode,
	warnings,
	currentDate,
}: AssignSectorInput): CleaningGeneratedAssignmentCell {
	const required = Math.max(1, sector.peopleRequired || 1);

	const eligible = people
		.filter((person) => isEligibleForSector(person, sector, usedPersonIds))
		.sort((a, b) => compareByRotation(a, b, rollingRotationMap));

	const assigned = pickPeopleForSector({
		required,
		eligible,
		usedPersonIds,
		assignmentMode,
	});

	for (const person of assigned) {
		rollingRotationMap.set(person.id, {
			personId: person.id,
			lastAssignedAtByType: currentDate,
			lastAssignedAtOverall: currentDate,
		});
	}

	if (assigned.length < required) {
		warnings.push(
			`O setor "${sector.name}" não teve pessoas suficientes para preencher ${required} vaga(s).`,
		);
	}

	return {
		sectorId: sector.id,
		sectorName: sector.name,
		required,
		assigned: assigned.map((person, index) => ({
			personId: person.id,
			personName: person.name,
			familyId: person.familyId,
			familyName: person.familyName,
			groupId: person.groupId,
			groupName: person.groupName,
			position: index,
		})),
	};
}

function isEligibleForSector(
	person: CleaningCandidatePerson,
	sector: CleaningSectorRule,
	usedPersonIds: Set<string>,
) {
	if (!person.isActive || !person.cleaning) return false;
	if (usedPersonIds.has(person.id)) return false;
	if (!sector.allowYoung && person.young) return false;
	if (sector.targetSex && person.sex !== sector.targetSex) return false;
	return true;
}

function compareByRotation(
	a: CleaningCandidatePerson,
	b: CleaningCandidatePerson,
	rotationMap: Map<string, RotationEntry>,
) {
	const aRotation = rotationMap.get(a.id);
	const bRotation = rotationMap.get(b.id);

	const aByType = aRotation?.lastAssignedAtByType?.getTime() ?? 0;
	const bByType = bRotation?.lastAssignedAtByType?.getTime() ?? 0;

	if (aByType !== bByType) {
		return aByType - bByType;
	}

	const aOverall = aRotation?.lastAssignedAtOverall?.getTime() ?? 0;
	const bOverall = bRotation?.lastAssignedAtOverall?.getTime() ?? 0;

	if (aOverall !== bOverall) {
		return aOverall - bOverall;
	}

	return a.name.localeCompare(b.name, "pt-BR");
}

function pickPeopleForSector({
	required,
	eligible,
	usedPersonIds,
	assignmentMode,
}: {
	required: number;
	eligible: CleaningCandidatePerson[];
	usedPersonIds: Set<string>;
	assignmentMode: CleaningTypeConfigView["assignmentMode"];
}) {
	if (assignmentMode === "FAMILY") {
		return pickByFamily(required, eligible, usedPersonIds);
	}

	if (assignmentMode === "GROUP") {
		return pickByGroup(required, eligible, usedPersonIds);
	}

	return pickByPerson(required, eligible, usedPersonIds);
}

function pickByPerson(
	required: number,
	eligible: CleaningCandidatePerson[],
	usedPersonIds: Set<string>,
) {
	const assigned: CleaningCandidatePerson[] = [];

	for (const person of eligible) {
		if (assigned.length >= required) break;
		if (usedPersonIds.has(person.id)) continue;

		assigned.push(person);
		usedPersonIds.add(person.id);
	}

	return assigned;
}

function pickByFamily(
	required: number,
	eligible: CleaningCandidatePerson[],
	usedPersonIds: Set<string>,
) {
	const byFamily = new Map<string, CleaningCandidatePerson[]>();

	for (const person of eligible) {
		if (!person.familyId) continue;
		const current = byFamily.get(person.familyId) ?? [];
		current.push(person);
		byFamily.set(person.familyId, current);
	}

	const families = Array.from(byFamily.values()).sort((a, b) => {
		const aBest = a[0]?.name ?? "";
		const bBest = b[0]?.name ?? "";
		return aBest.localeCompare(bBest, "pt-BR");
	});

	const assigned: CleaningCandidatePerson[] = [];

	for (const family of families) {
		for (const person of family) {
			if (assigned.length >= required) break;
			if (usedPersonIds.has(person.id)) continue;

			assigned.push(person);
			usedPersonIds.add(person.id);
		}

		if (assigned.length >= required) {
			return assigned;
		}
	}

	return [
		...assigned,
		...pickByPerson(required - assigned.length, eligible, usedPersonIds),
	];
}

function pickByGroup(
	required: number,
	eligible: CleaningCandidatePerson[],
	usedPersonIds: Set<string>,
) {
	const byGroup = new Map<string, CleaningCandidatePerson[]>();

	for (const person of eligible) {
		if (!person.groupId) continue;
		const current = byGroup.get(person.groupId) ?? [];
		current.push(person);
		byGroup.set(person.groupId, current);
	}

	const groups = Array.from(byGroup.values()).sort((a, b) => {
		const aBest = a[0]?.name ?? "";
		const bBest = b[0]?.name ?? "";
		return aBest.localeCompare(bBest, "pt-BR");
	});

	const assigned: CleaningCandidatePerson[] = [];

	for (const group of groups) {
		for (const person of group) {
			if (assigned.length >= required) break;
			if (usedPersonIds.has(person.id)) continue;

			assigned.push(person);
			usedPersonIds.add(person.id);
		}

		if (assigned.length >= required) {
			return assigned;
		}
	}

	return [
		...assigned,
		...pickByPerson(required - assigned.length, eligible, usedPersonIds),
	];
}
