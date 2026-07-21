import type { RosterSector } from "@/features/cleaning/lib/roster-types";

export function sectorsFromConfig(typeView: {
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
}): RosterSector[] {
	return typeView.sectors
		.filter((s) => s.isActive)
		.map((s) => ({
			id: s.id,
			name: s.name,
			description: s.description,
			peopleRequired: s.peopleRequired ?? 1,
			allowYoung: s.allowYoung,
			targetSex: s.targetSex,
			sortOrder: s.sortOrder,
		}));
}
