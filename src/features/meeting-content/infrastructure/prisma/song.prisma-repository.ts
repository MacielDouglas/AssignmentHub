import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";
import { db } from "@/lib/db";
import type { SongEntity } from "../../domain/entities/song";
import type {
	CreateSongInput,
	SongRepository,
	UpdateSongInput,
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

	async upsertMany(
		items: Array<{
			locale: ContentLocale;
			number: number;
			title: string;
			notes: string | null;
		}>,
	): Promise<number> {
		if (items.length === 0) return 0;

		let count = 0;

		await db.$transaction(async (tx) => {
			for (const item of items) {
				// Se o schema NÃO tem unique locale_number, use findFirst + update/create
				const existing = await tx.publicTalk.findFirst({
					where: {
						locale: item.locale,
						number: item.number,
						organizationId: null,
					},
					select: { id: true },
				});

				if (existing) {
					await tx.publicTalk.update({
						where: { id: existing.id },
						data: { title: item.title },
					});
				} else {
					await tx.publicTalk.create({
						data: {
							organizationId: null,
							locale: item.locale,
							number: item.number,
							title: item.title,
							notes: item.notes,
						},
					});
				}

				count += 1;
			}
		});

		return count;
	}
	// }

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
