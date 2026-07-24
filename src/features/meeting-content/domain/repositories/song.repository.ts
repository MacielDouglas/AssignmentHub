import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";
import type { SongEntity } from "../entities/song";

export type CreateSongInput = {
	number: number;
	title: string;
	locale: ContentLocale;
};

export type UpdateSongInput = {
	id: string;
	number: number;
	title: string;
	locale: ContentLocale;
};

export type UpsertSongInput = {
	number: number;
	title: string;
	locale: ContentLocale;
};

export interface SongRepository {
	list(locale?: ContentLocale): Promise<SongEntity[]>;

	countByLocale(): Promise<Array<{ locale: ContentLocale; count: number }>>;

	search(query: string, locale?: ContentLocale): Promise<SongEntity[]>;

	create(input: CreateSongInput): Promise<SongEntity>;

	update(input: UpdateSongInput): Promise<SongEntity>;

	upsertMany(items: UpsertSongInput[]): Promise<number>;

	deleteByIds(ids: string[]): Promise<number>;

	deleteAll(locale?: ContentLocale): Promise<number>;

	findIdByNumber(number: number, locale: ContentLocale): Promise<string | null>;
}
