// src/features/cleaning-list/lib/auto-assign-cleaning.ts
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
	const rolling = new Map(rotationMap);

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
					rolling,
					assignmentMode: config.assignmentMode,
					warnings,
					currentDate: date,
				}),
			);

		rows.push({ date, cells });
	}

	return { cleaningType, periodFrom, periodTo, rows, warnings };
}

function assignSector(input: {
	sector: CleaningSectorRule;
	people: CleaningCandidatePerson[];
	usedPersonIds: Set<string>;
	rolling: Map<string, RotationEntry>;
	assignmentMode: CleaningTypeConfigView["assignmentMode"];
	warnings: string[];
	currentDate: Date;
}): CleaningGeneratedAssignmentCell {
	const {
		sector,
		people,
		usedPersonIds,
		rolling,
		assignmentMode,
		warnings,
		currentDate,
	} = input;

	// MEETING FAMILY/GROUP: peopleRequired pode ser null no banco → fallback 1
	const required = Math.max(1, sector.peopleRequired ?? 1);

	const eligible = people
		.filter((person) => isEligible(person, sector, usedPersonIds))
		.sort((a, b) => compareByRotation(a, b, rolling));

	const assigned = pickPeople(
		required,
		eligible,
		usedPersonIds,
		assignmentMode,
	);

	for (const person of assigned) {
		rolling.set(person.id, {
			personId: person.id,
			lastAssignedAtByType: currentDate,
			lastAssignedAtOverall: currentDate,
		});
	}

	if (assigned.length < required) {
		warnings.push(
			`O setor ${sector.name} não teve pessoas suficientes para preencher ${required} vaga(s).`,
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

function isEligible(
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
	const aR = rotationMap.get(a.id);
	const bR = rotationMap.get(b.id);
	const aByType = aR?.lastAssignedAtByType?.getTime() ?? 0;
	const bByType = bR?.lastAssignedAtByType?.getTime() ?? 0;
	if (aByType !== bByType) return aByType - bByType;

	const aOverall = aR?.lastAssignedAtOverall?.getTime() ?? 0;
	const bOverall = bR?.lastAssignedAtOverall?.getTime() ?? 0;
	if (aOverall !== bOverall) return aOverall - bOverall;

	return a.name.localeCompare(b.name, "pt-BR");
}

function pickPeople(
	required: number,
	eligible: CleaningCandidatePerson[],
	usedPersonIds: Set<string>,
	assignmentMode: CleaningTypeConfigView["assignmentMode"],
) {
	if (assignmentMode === "FAMILY") {
		return pickByUnit(required, eligible, usedPersonIds, "familyId");
	}
	if (assignmentMode === "GROUP") {
		return pickByUnit(required, eligible, usedPersonIds, "groupId");
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

function pickByUnit(
	required: number,
	eligible: CleaningCandidatePerson[],
	usedPersonIds: Set<string>,
	key: "familyId" | "groupId",
) {
	const buckets = new Map<string, CleaningCandidatePerson[]>();

	for (const person of eligible) {
		const unitId = person[key];
		if (!unitId) continue;
		const current = buckets.get(unitId) ?? [];
		current.push(person);
		buckets.set(unitId, current);
	}

	const units = Array.from(buckets.values()).sort((a, b) => {
		const aBest = a[0]?.name ?? "";
		const bBest = b[0]?.name ?? "";
		return aBest.localeCompare(bBest, "pt-BR");
	});

	const assigned: CleaningCandidatePerson[] = [];

	for (const unit of units) {
		for (const person of unit) {
			if (assigned.length >= required) break;
			if (usedPersonIds.has(person.id)) continue;
			assigned.push(person);
			usedPersonIds.add(person.id);
		}
		if (assigned.length >= required) break;
	}

	if (assigned.length >= required) return assigned;

	return [
		...assigned,
		...pickByPerson(required - assigned.length, eligible, usedPersonIds),
	];
}
