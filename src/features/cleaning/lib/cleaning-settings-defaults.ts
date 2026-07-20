// src/features/cleaning/lib/cleaning-settings-defaults.ts
import type { CleaningTypeConfigFormState } from "../domain/cleaning-settings.types";

export function createEmptySector(sortOrder = 0) {
	return {
		clientKey: `sector-${crypto.randomUUID()}`,
		name: "",
		description: "",
		peopleRequired: 1,
		allowYoung: true,
		targetSex: "" as const,
		sortOrder,
		isActive: true,
		locked: false,
	};
}

export function createDefaultTypeConfig(
	type: CleaningTypeConfigFormState["type"],
): CleaningTypeConfigFormState {
	return {
		type,
		enabled: false,
		assignmentMode:
			type === "MEETING" ? "PERSON" : type === "WEEKLY" ? "FAMILY" : "GROUP",
		notes: "",
		weekday: "",
		dates: [],
		sectors: [createEmptySector(0)],
	};
}
