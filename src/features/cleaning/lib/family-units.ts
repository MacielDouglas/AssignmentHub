import type { EligiblePerson } from "@/features/cleaning/lib/roster-types";

export type AssignmentUnit = {
	/** null = pessoa sem família */
	familyId: string | null;
	members: EligiblePerson[];
};

/** Agrupa por familyId; quem não tem família vira unidade de 1. */
export function buildAssignmentUnits(
	people: EligiblePerson[],
): AssignmentUnit[] {
	const families = new Map<string, EligiblePerson[]>();
	const solos: EligiblePerson[] = [];

	for (const p of people) {
		if (p.familyId) {
			const list = families.get(p.familyId) ?? [];
			list.push(p);
			families.set(p.familyId, list);
		} else {
			solos.push(p);
		}
	}

	const units: AssignmentUnit[] = [];

	for (const [familyId, members] of families) {
		units.push({
			familyId,
			members: [...members].sort((a, b) => a.name.localeCompare(b.name)),
		});
	}

	for (const p of solos) {
		units.push({ familyId: null, members: [p] });
	}

	return units;
}
