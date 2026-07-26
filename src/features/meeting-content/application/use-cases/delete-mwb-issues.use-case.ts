import type MwbRepository from "../../domain/repositories/mwb.repository";
import type { ContentLocale } from "../../domain/values-objects/content-locale";

type Deps = {
	mwbRepository: MwbRepository;
};

export async function deleteMwbIssuesUseCase(
	deps: Deps,
	ids: string[],
): Promise<number> {
	let deleted = 0;

	for (const id of ids) {
		const ok = await deps.mwbRepository.deleteIssue(id);
		if (ok) deleted += 1;
	}

	return deleted;
}

export async function deleteAllMwbIssuesUseCase(
	deps: Deps,
	locale: ContentLocale,
): Promise<number> {
	return deps.mwbRepository.deleteIssuesByLocale(locale);
}
