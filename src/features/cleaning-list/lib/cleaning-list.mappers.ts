import type {
	CleaningGeneratedAssignmentRow,
	CleaningSavedAssignmentRow,
	CleaningTypeConfigView,
} from "../domain/cleaning-list.types";

type RawCleaningConfig = Omit<CleaningTypeConfigView, "sectors"> & {
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
	config: RawCleaningConfig,
): CleaningTypeConfigView {
	return {
		...config,
		sectors: config.sectors.map((sector) => ({
			...sector,
			peopleRequired: sector.peopleRequired ?? 1,
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
		family: { name: string } | null;
		group: { name: string } | null;
	}>,
) {
	return people.map((person) => ({
		id: person.id,
		name: person.name,
		sex: person.sex,
		young: person.young,
		cleaning: person.cleaning,
		isActive: person.isActive,
		isMarried: person.isMarried,
		familyId: person.familyId ?? null,
		groupId: person.groupId ?? null,
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
						sector: {
							id: string;
							name: string;
						};
						person: {
							id: string;
							name: string;
						};
						family: {
							id: string;
							name: string;
						} | null;
						group: {
							id: string;
							name: string;
						} | null;
					}>;
				}>;
		  }
		| null
		| undefined,
): CleaningSavedAssignmentRow[] {
	if (!savedList) {
		return [];
	}

	return savedList.dates.map((dateItem) => {
		const cellMap = new Map<
			string,
			{
				sectorId: string;
				sectorName: string;
				required: number;
				assigned: Array<{
					personId: string;
					personName: string;
					familyId: string | null;
					familyName: string | null;
					groupId: string | null;
					groupName: string | null;
					position: number;
				}>;
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

			cellMap.set(assignment.sector.id, current);
		}

		return {
			date: dateItem.date,
			cells: Array.from(cellMap.values()),
		};
	});
}

export function serializeRows(rows: CleaningGeneratedAssignmentRow[]) {
	return JSON.stringify(rows);
}
