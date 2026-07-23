import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";
import type { WatchtowerStudyRepository } from "../../domain/repositories/watchtower-study.repository";

export async function deleteWatchtowerStudiesUseCase(
	deps: { studies: WatchtowerStudyRepository },
	ids: string[],
) {
	const count = await deps.studies.deleteByIds(ids);
	return { count };
}

export async function deleteAllWatchtowerStudiesUseCase(
	deps: { studies: WatchtowerStudyRepository },
	locale?: ContentLocale,
) {
	const count = await deps.studies.deleteAll(locale);
	return { count };
}
