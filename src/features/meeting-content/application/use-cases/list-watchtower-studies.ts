import type { ContentImportJobRepository } from "@/features/meeting-content/domain/repositories/content-import-job.repository";
import type { WatchtowerStudyRepository } from "@/features/meeting-content/domain/repositories/watchtower-study.repository";
import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";

export async function listWatchtowerStudiesUseCase(
	deps: {
		studies: WatchtowerStudyRepository;
		jobs: ContentImportJobRepository;
	},
	locale?: ContentLocale,
) {
	const [items, counts, pendingJob] = await Promise.all([
		deps.studies.list(locale),
		deps.studies.countByLocale(),
		deps.jobs.findLatestPending("WATCHTOWER"),
	]);

	return { items, counts, pendingJob };
}
