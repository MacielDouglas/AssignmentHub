// src/features/cleaning-list/lib/cleaning-list.mappers.ts
import type {
	CleaningCandidatePerson,
	CleaningGeneratedAssignmentRow,
	CleaningTypeConfigView,
} from "../domain/cleaning-list.types";

type RawConfig = {
	id: string;
	type: CleaningTypeConfigView["type"];
	enabled: boolean;
	assignmentMode: CleaningTypeConfigView["assignmentMode"];
	notes: string | null;
	weekdays: CleaningTypeConfigView["weekdays"];
	dates: CleaningTypeConfigView["dates"];
	sectors: Array<{
		id: string;
		name: string;
		description: string | null;
		peopleRequired: number | null;
		allowYoung: boolean;
		targetSex: "MALE" | "FEMALE" | null;
		sortOrder: number;
		isActive: boolean;
	}>;
};

export function normalizeCleaningConfig(
	config: RawConfig,
): CleaningTypeConfigView {
	return {
		...config,
		sectors: config.sectors.map((sector) => ({
			...sector,
			peopleRequired: Math.max(1, sector.peopleRequired ?? 1),
		})),
	};
}

export function mapOrganizationPeopleToCandidates(
	people: Array<{
		id: string;
		name: string;
		sex: "MALE" | "FEMALE";
		young: boolean;
		cleaning: boolean;
		isActive: boolean;
		isMarried: boolean;
		familyId: string | null;
		groupId: string | null;
		family: { id: string; name: string } | null;
		group: { id: string; name: string } | null;
	}>,
): CleaningCandidatePerson[] {
	return people.map((person) => ({
		id: person.id,
		name: person.name,
		sex: person.sex,
		young: person.young,
		cleaning: person.cleaning,
		isActive: person.isActive,
		isMarried: person.isMarried,
		familyId: person.familyId,
		groupId: person.groupId,
		familyName: person.family?.name ?? null,
		groupName: person.group?.name ?? null,
	}));
}

export function mapSavedListToRows(
	savedList:
		| {
				dates: Array<{
					date: Date;
					assignments: Array<{
						position: number;
						sector: { id: string; name: string };
						person: { id: string; name: string };
						family: { id: string; name: string } | null;
						group: { id: string; name: string } | null;
					}>;
				}>;
		  }
		| null
		| undefined,
): CleaningGeneratedAssignmentRow[] {
	if (!savedList) return [];

	return savedList.dates.map((dateItem) => {
		const cellMap = new Map<
			string,
			{
				sectorId: string;
				sectorName: string;
				required: number;
				assigned: CleaningGeneratedAssignmentRow["cells"][number]["assigned"];
			}
		>();

		for (const assignment of dateItem.assignments) {
			const current = cellMap.get(assignment.sector.id) ?? {
				sectorId: assignment.sector.id,
				sectorName: assignment.sector.name,
				required: 1,
				assigned: [],
			};

			current.assigned.push({
				personId: assignment.person.id,
				personName: assignment.person.name,
				familyId: assignment.family?.id ?? null,
				familyName: assignment.family?.name ?? null,
				groupId: assignment.group?.id ?? null,
				groupName: assignment.group?.name ?? null,
				position: assignment.position,
			});

			current.required = Math.max(current.required, current.assigned.length);
			cellMap.set(assignment.sector.id, current);
		}

		return {
			date: dateItem.date,
			cells: Array.from(cellMap.values()),
		};
	});
}

export function serializeRows(rows: CleaningGeneratedAssignmentRow[]) {
	return JSON.stringify(
		rows.map((row) => ({
			date: row.date.toISOString(),
			cells: row.cells,
		})),
	);
}
