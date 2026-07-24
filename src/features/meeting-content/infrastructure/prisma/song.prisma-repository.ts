import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";
import { db } from "@/lib/db";
import type { SongEntity } from "../../domain/entities/song";
import type {
	CreateSongInput,
	SongRepository,
	UpdateSongInput,
	UpsertSongInput,
} from "../../domain/repositories/song.repository";

type SongRow = {
	id: string;
	number: number;
	title: string;
	locale: ContentLocale;
	createdAt: Date;
	updatedAt: Date;
};

function mapSong(row: SongRow): SongEntity {
	return {
		id: row.id,
		number: row.number,
		title: row.title,
		locale: row.locale,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

export class PrismaSongRepository implements SongRepository {
	async list(locale?: ContentLocale): Promise<SongEntity[]> {
		const rows = await db.song.findMany({
			where: locale ? { locale } : undefined,
			orderBy: [{ locale: "asc" }, { number: "asc" }],
		});

		return rows.map(mapSong);
	}

	async countByLocale(): Promise<
		Array<{ locale: ContentLocale; count: number }>
	> {
		const rows = await db.song.groupBy({
			by: ["locale"],
			_count: { _all: true },
		});

		return rows.map((row) => ({
			locale: row.locale,
			count: row._count._all,
		}));
	}

	async search(query: string, locale?: ContentLocale): Promise<SongEntity[]> {
		const value = query.trim();

		if (!value) {
			return this.list(locale);
		}

		const maybeNumber = Number(value);

		const rows = await db.song.findMany({
			where: {
				AND: [
					...(locale ? [{ locale }] : []),
					Number.isInteger(maybeNumber) && maybeNumber >= 1
						? {
								OR: [
									{ number: maybeNumber },
									{
										title: {
											contains: value,
											mode: "insensitive",
										},
									},
								],
							}
						: {
								title: {
									contains: value,
									mode: "insensitive",
								},
							},
				],
			},
			orderBy: { number: "asc" },
			take: 200,
		});

		return rows.map(mapSong);
	}

	async create(input: CreateSongInput): Promise<SongEntity> {
		const row = await db.song.create({
			data: {
				number: input.number,
				title: input.title,
				locale: input.locale,
			},
		});

		return mapSong(row);
	}

	async update(input: UpdateSongInput): Promise<SongEntity> {
		const row = await db.song.update({
			where: { id: input.id },
			data: {
				number: input.number,
				title: input.title,
				locale: input.locale,
			},
		});

		return mapSong(row);
	}

	async upsertMany(items: UpsertSongInput[]): Promise<number> {
		const chunkSize = 50;
		let count = 0;

		for (let index = 0; index < items.length; index += chunkSize) {
			const chunk = items.slice(index, index + chunkSize);

			await db.$transaction(
				chunk.map((song) =>
					db.song.upsert({
						where: {
							number_locale: {
								number: song.number,
								locale: song.locale,
							},
						},
						create: {
							number: song.number,
							title: song.title,
							locale: song.locale,
						},
						update: {
							title: song.title,
						},
					}),
				),
			);

			count += chunk.length;
		}

		return count;
	}

	async deleteByIds(ids: string[]): Promise<number> {
		const result = await db.song.deleteMany({
			where: {
				id: {
					in: ids,
				},
			},
		});

		return result.count;
	}

	async deleteAll(locale?: ContentLocale): Promise<number> {
		const result = await db.song.deleteMany({
			where: locale ? { locale } : undefined,
		});

		return result.count;
	}

	async findIdByNumber(
		number: number,
		locale: ContentLocale,
	): Promise<string | null> {
		const song = await db.song.findUnique({
			where: {
				number_locale: {
					number,
					locale,
				},
			},
			select: {
				id: true,
			},
		});

		return song?.id ?? null;
	}
}
