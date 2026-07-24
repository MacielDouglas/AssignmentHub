import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";
import type { SongbookExtract } from "../dto/songbook-extract.dto";

export interface SongbookExtractor {
	extract(
		buffer: ArrayBuffer,
		fileName: string,
		locale: ContentLocale,
	): Promise<SongbookExtract>;
}
