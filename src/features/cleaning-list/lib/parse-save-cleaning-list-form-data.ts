// src/features/cleaning-list/lib/parse-save-cleaning-list-form-data.ts
import type { SaveCleaningListInput } from "../schemas/save-cleaning-list.schema";

function str(v: FormDataEntryValue | null) {
	return typeof v === "string" ? v.trim() : "";
}

export function parseSaveCleaningListFormData(
	formData: FormData,
): SaveCleaningListInput {
	const rowsJson = str(formData.get("rowsJson"));

	let rows: unknown = [];
	try {
		// limite de payload (~1.5MB)
		if (rowsJson.length > 1_500_000) {
			rows = [];
		} else {
			rows = JSON.parse(rowsJson);
		}
	} catch {
		rows = [];
	}

	return {
		organizationId: str(formData.get("organizationId")),
		cleaningType: str(
			formData.get("cleaningType"),
		) as SaveCleaningListInput["cleaningType"],
		periodFrom: new Date(str(formData.get("periodFrom"))),
		periodTo: new Date(str(formData.get("periodTo"))),
		rows: rows as SaveCleaningListInput["rows"],
	};
}
