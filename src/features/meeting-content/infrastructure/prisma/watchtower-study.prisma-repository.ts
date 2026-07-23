import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";
import { db } from "@/lib/db";
import type { WatchtowerStudyEntity } from "../../domain/entities/watchtower-study";
import type {
  UpdateWatchtowerStudyInput,
  UpsertWatchtowerStudyInput,
  WatchtowerStudyRepository,
} from "../../domain/repositories/watchtower-study.repository";
import { toIsoDate } from "../../domain/values-objects/study-week";

function mapStudy(row: {
	id: string;
	locale: ContentLocale;
	weekStart: Date;
	weekEnd: Date;
	weekLabelRaw: string | null;
	title: string;
	openingSongNum: number;
	closingSongNum: number;
	highlightColor: string | null;
	issueCode: string | null;
	createdAt: Date;
	updatedAt: Date;
	openingSong: { title: string } | null;
	closingSong: { title: string } | null;
}): WatchtowerStudyEntity {
	return {
		id: row.id,
		locale: row.locale,
		weekStart: toIsoDate(row.weekStart),
		weekEnd: toIsoDate(row.weekEnd),
		weekLabelRaw: row.weekLabelRaw,
		title: row.title,
		openingSongNum: row.openingSongNum,
		closingSongNum: row.closingSongNum,
		highlightColor: row.highlightColor,
		issueCode: row.issueCode,
		openingSongTitle: row.openingSong?.title ?? null,
		closingSongTitle: row.closingSong?.title ?? null,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

export class PrismaWatchtowerStudyRepository
	implements WatchtowerStudyRepository
{
	async list(locale?: ContentLocale): Promise<WatchtowerStudyEntity[]> {
		const rows = await db.watchtowerStudy.findMany({
			where: locale ? { locale } : undefined,
			orderBy: [{ locale: "asc" }, { weekStart: "desc" }],
			include: {
				openingSong: { select: { title: true } },
				closingSong: { select: { title: true } },
			},
		});
		return rows.map((row) => mapStudy(row as never));
	}

	async countByLocale() {
		const groups = await db.watchtowerStudy.groupBy({
			by: ["locale"],
			_count: { _all: true },
		});
		return groups.map((g) => ({
			locale: g.locale as ContentLocale,
			count: g._count._all,
		}));
	}

	async upsertByWeek(input: UpsertWatchtowerStudyInput): Promise<void> {
		await db.watchtowerStudy.upsert({
			where: {
				weekStart_locale: {
					weekStart: input.weekStart,
					locale: input.locale,
				},
			},
			create: {
				locale: input.locale,
				weekStart: input.weekStart,
				weekEnd: input.weekEnd,
				weekLabelRaw: input.weekLabelRaw,
				title: input.title,
				openingSongNum: input.openingSongNum,
				closingSongNum: input.closingSongNum,
				highlightColor: input.highlightColor,
				issueCode: input.issueCode,
				openingSongId: input.openingSongId,
				closingSongId: input.closingSongId,
			},
			update: {
				weekEnd: input.weekEnd,
				weekLabelRaw: input.weekLabelRaw,
				title: input.title,
				openingSongNum: input.openingSongNum,
				closingSongNum: input.closingSongNum,
				highlightColor: input.highlightColor,
				issueCode: input.issueCode,
				openingSongId: input.openingSongId,
				closingSongId: input.closingSongId,
			},
		});
	}

  async updateById(input: UpdateWatchtowerStudyInput): Promise<void> {
  await db.watchtowerStudy.update({
    where: {
      id: input.id,
    },
    data: {
      locale: input.locale,
      weekStart: input.weekStart,
      weekEnd: input.weekEnd,
      weekLabelRaw: input.weekLabelRaw,
      title: input.title,
      openingSongNum: input.openingSongNum,
      closingSongNum: input.closingSongNum,
      highlightColor: input.highlightColor,
      issueCode: input.issueCode,
      openingSongId: input.openingSongId,
      closingSongId: input.closingSongId,
    },
  });
}

	async deleteByIds(ids: string[]): Promise<number> {
		const res = await db.watchtowerStudy.deleteMany({
			where: { id: { in: ids } },
		});
		return res.count;
	}

	async deleteAll(locale?: ContentLocale): Promise<number> {
		const res = await db.watchtowerStudy.deleteMany({
			where: locale ? { locale } : undefined,
		});
		return res.count;
	}

	async findSongId(
		number: number,
		locale: ContentLocale,
	): Promise<string | null> {
		const song = await db.song.findUnique({
			where: { number_locale: { number, locale } },
			select: { id: true },
		});
		return song?.id ?? null;
	}
}
