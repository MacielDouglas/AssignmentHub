import type { CleaningType } from "@/generated/prisma/client";

/** Chaves em messages → CleaningTypes */
export function cleaningTypeMessageKey(
	type: CleaningType,
): "MEETING" | "WEEKLY" | "GENERAL" {
	return type;
}
