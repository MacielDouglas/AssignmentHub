// src/features/cleaning-list/lib/parse-generate-cleaning-list-form-data.ts
import type { GenerateCleaningListInput } from "../schemas/generate-cleaning-list.schema";

function str(v: FormDataEntryValue | null) {
	return typeof v === "string" ? v.trim() : "";
}

export function parseGenerateCleaningListFormData(
	formData: FormData,
): GenerateCleaningListInput {
	return {
		organizationId: str(formData.get("organizationId")),
		cleaningType: str(
			formData.get("cleaningType"),
		) as GenerateCleaningListInput["cleaningType"],
		periodFrom: new Date(str(formData.get("periodFrom"))),
		periodTo: new Date(str(formData.get("periodTo"))),
	};
}
