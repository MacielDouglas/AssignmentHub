import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";
import { createMeetingContentDeps } from "../../infrastructure/composition";
import { listSongsUseCase } from "../use-cases/list-songs";

export async function listSongsPageData(locale?: ContentLocale) {
	const deps = createMeetingContentDeps();
	return listSongsUseCase(deps, locale);
}
