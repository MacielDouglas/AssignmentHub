import type { SaveCleaningListInput } from "../schemas/save-cleaning-list.schema";

export function parseSaveCleaningListFormData(
	formData: FormData,
): SaveCleaningListInput {
	const organizationId = String(formData.get("organizationId") ?? "");
	const cleaningType = String(formData.get("cleaningType") ?? "");
	const periodFrom = String(formData.get("periodFrom") ?? "");
	const periodTo = String(formData.get("periodTo") ?? "");
	const rowsJson = String(formData.get("rowsJson") ?? "[]");

	let rows: unknown = [];

	try {
		rows = JSON.parse(rowsJson);
	} catch {
		rows = [];
	}

	return {
		organizationId,
		cleaningType: cleaningType as SaveCleaningListInput["cleaningType"],
		periodFrom: new Date(periodFrom),
		periodTo: new Date(periodTo),
		rows: rows as SaveCleaningListInput["rows"],
	};
}
