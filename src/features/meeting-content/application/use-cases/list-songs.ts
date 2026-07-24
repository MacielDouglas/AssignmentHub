import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";
import type { ContentImportJobRepository } from "../../domain/repositories/content-import-job.repository";
import type { SongRepository } from "../../domain/repositories/song.repository";

export async function listSongsUseCase(
	deps: {
		songs: SongRepository;
		jobs: ContentImportJobRepository;
	},
	locale?: ContentLocale,
) {
	const [items, counts, pendingJob] = await Promise.all([
		deps.songs.list(locale),
		deps.songs.countByLocale(),
		deps.jobs.findLatestPending("SONGBOOK"),
	]);

	return { items, counts, pendingJob };
}
