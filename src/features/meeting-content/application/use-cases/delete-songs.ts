import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";
import type { SongRepository } from "../../domain/repositories/song.repository";

export async function deleteSongsUseCase(
	deps: { songs: SongRepository },
	ids: string[],
) {
	return deps.songs.deleteByIds(ids);
}

export async function deleteAllSongsUseCase(
	deps: { songs: SongRepository },
	locale?: ContentLocale,
) {
	return deps.songs.deleteAll(locale);
}
