import type { GenerateCleaningListInput } from "../schemas/generate-cleaning-list.schema";

export function parseGenerateCleaningListFormData(
	formData: FormData,
): GenerateCleaningListInput {
	return {
		organizationId: String(formData.get("organizationId") ?? ""),
		cleaningType: String(
			formData.get("cleaningType") ?? "",
		) as GenerateCleaningListInput["cleaningType"],
		periodFrom: new Date(String(formData.get("periodFrom") ?? "")),
		periodTo: new Date(String(formData.get("periodTo") ?? "")),
	};
}
