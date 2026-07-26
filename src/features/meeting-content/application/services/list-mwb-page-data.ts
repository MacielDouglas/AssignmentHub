import type { ContentLocale } from "../../domain/values-objects/content-locale";
import { createMeetingContentDeps } from "../../infrastructure/composition";
import { listMwbUseCase } from "../use-cases/list-mwb.use-case";

export async function listMwbPageData(locale?: ContentLocale) {
	const deps = createMeetingContentDeps();
	return listMwbUseCase(deps, locale);
}
