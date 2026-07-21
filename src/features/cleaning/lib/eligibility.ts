import type {
	EligiblePerson,
	RosterSector,
} from "@/features/cleaning/lib/roster-types";
import type { Sex } from "@/generated/prisma/client";

export function isEligibleForSector(
	person: EligiblePerson,
	sector: RosterSector,
	relaxYoung: boolean,
): boolean {
	if (sector.targetSex && person.sex !== sector.targetSex) return false;
	if (!sector.allowYoung && person.young && !relaxYoung) return false;
	return true;
}

export function requiredCount(sector: RosterSector): number {
	return Math.max(1, sector.peopleRequired || 1);
}

export function sexLabel(sex: Sex): string {
	return sex === "MALE" ? "M" : "F";
}
