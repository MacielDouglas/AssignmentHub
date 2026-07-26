import type { ContentImportJobRepository } from "../../domain/repositories/content-import-job.repository";
import type MwbRepository from "../../domain/repositories/mwb.repository";
import type { ContentLocale } from "../../domain/values-objects/content-locale";

type Deps = {
	mwbRepository: MwbRepository;
	jobs: ContentImportJobRepository;
};

export async function listMwbUseCase(deps: Deps, locale?: ContentLocale) {
	const [issues, counts, pendingJob] = await Promise.all([
		deps.mwbRepository.listIssues(locale),
		deps.mwbRepository.countByLocale(),
		deps.jobs.findLatestPending("MWB"),
	]);

	return {
		issues,
		counts,
		pendingJob,
	};
}
