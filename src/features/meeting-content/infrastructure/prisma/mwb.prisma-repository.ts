import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

import type { MwbExtract } from "../../application/dto/mwb-extract.dto";
import type { MwbIssueEntity } from "../../domain/entities/mwb";
import type MwbRepository from "../../domain/repositories/mwb.repository";
import type {
	CommitMwbResult,
	MwbLocaleCount,
} from "../../domain/repositories/mwb.repository";
import type { ContentLocale } from "../../domain/values-objects/content-locale";

type MwbSectionCode = "TREASURES" | "APPLY" | "LIVING";

type MwbIssueRow = {
	id: string;
	locale: ContentLocale;
	symbol: string;
	title: string;
	coverTitle: string | null;
	year: number | null;
	month: number | null;
	weeks: Array<{
		id: string;
		weekStart: Date;
		weekEnd: Date;
		weekLabelRaw: string | null;
		dateRangeRaw: string | null;
		openingSongNum: number | null;
		middleSongNum: number | null;
		closingSongNum: number | null;
		sortOrder: number;
		sections: Array<{
			id: string;
			name: string;
			code: MwbSectionCode | null;
			sortOrder: number;
			parts: Array<{
				id: string;
				sortOrder: number;
				title: string;
				theme: string | null;
				durationMin: number | null;
				modality: string | null;
				source: string | null;
			}>;
		}>;
	}>;
};

function toIsoDate(value: Date): string {
	return value.toISOString().slice(0, 10);
}

function asDateOnly(value: string): Date {
	const [year, month, day] = value.split("-").map(Number);

	if (
		!Number.isInteger(year) ||
		!Number.isInteger(month) ||
		!Number.isInteger(day) ||
		year < 1 ||
		month < 1 ||
		month > 12 ||
		day < 1 ||
		day > 31
	) {
		throw new Error(`Data inválida: ${value}`);
	}

	const date = new Date(Date.UTC(year, month - 1, day));

	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		throw new Error(`Data inválida: ${value}`);
	}

	return date;
}

function sectionCode(
	code: MwbSectionCode | null | undefined,
): MwbSectionCode | null {
	if (code === "TREASURES" || code === "APPLY" || code === "LIVING") {
		return code;
	}

	return null;
}

function mapIssue(row: MwbIssueRow): MwbIssueEntity {
	return {
		id: row.id,
		locale: row.locale,
		symbol: row.symbol,
		title: row.title,
		coverTitle: row.coverTitle,
		year: row.year,
		month: row.month,
		weeksCount: row.weeks.length,
		weeks: row.weeks.map((week) => ({
			id: week.id,
			weekStart: toIsoDate(week.weekStart),
			weekEnd: toIsoDate(week.weekEnd),
			weekLabelRaw: week.weekLabelRaw,
			dateRangeRaw: week.dateRangeRaw,
			openingSongNum: week.openingSongNum,
			middleSongNum: week.middleSongNum,
			closingSongNum: week.closingSongNum,
			sortOrder: week.sortOrder,
			sections: week.sections.map((section) => ({
				id: section.id,
				name: section.name,
				code: section.code,
				sortOrder: section.sortOrder,
				parts: section.parts.map((part) => ({
					id: part.id,
					sortOrder: part.sortOrder,
					title: part.title,
					theme: part.theme,
					durationMin: part.durationMin,
					modality: part.modality,
					source: part.source,
				})),
			})),
		})),
	};
}

export default class PrismaMwbRepository implements MwbRepository {
	async commitExtract(data: MwbExtract): Promise<CommitMwbResult> {
		return db.$transaction(async (tx) => {
			const issue = await this.upsertIssue(tx, data);

			let weeksUpserted = 0;
			let sectionsCreated = 0;
			let partsCreated = 0;

			for (const weekInput of data.weeks) {
				const openingSongNum = weekInput.openingSongNum ?? null;
				const middleSongNum = weekInput.middleSongNum ?? null;
				const closingSongNum = weekInput.closingSongNum ?? null;

				const [openingSongId, middleSongId, closingSongId] = await Promise.all([
					this.findSongId(tx, data.locale, openingSongNum),
					this.findSongId(tx, data.locale, middleSongNum),
					this.findSongId(tx, data.locale, closingSongNum),
				]);

				const weekStart = asDateOnly(weekInput.weekStart);
				const weekEnd = asDateOnly(weekInput.weekEnd);

				const week = await tx.mwbWeek.upsert({
					where: {
						issueId_weekStart: {
							issueId: issue.id,
							weekStart,
						},
					},
					create: {
						issueId: issue.id,
						weekStart,
						weekEnd,
						weekLabelRaw: weekInput.weekLabelRaw ?? null,
						dateRangeRaw: weekInput.dateRangeRaw ?? null,
						openingSongNum,
						middleSongNum,
						closingSongNum,
						openingSongId,
						middleSongId,
						closingSongId,
						sortOrder: weekInput.sortOrder,
					},
					update: {
						weekEnd,
						weekLabelRaw: weekInput.weekLabelRaw ?? null,
						dateRangeRaw: weekInput.dateRangeRaw ?? null,
						openingSongNum,
						middleSongNum,
						closingSongNum,
						openingSongId,
						middleSongId,
						closingSongId,
						sortOrder: weekInput.sortOrder,
					},
					select: {
						id: true,
					},
				});

				weeksUpserted += 1;

				/*
				 * Regra A:
				 * Ao reimportar uma semana existente, suas seções e partes são
				 * totalmente substituídas para espelhar o arquivo .jwpub revisado.
				 *
				 * A deleção das seções também remove as partes por cascade.
				 */
				await tx.mwbSection.deleteMany({
					where: {
						weekId: week.id,
					},
				});

				for (const sectionInput of weekInput.sections) {
					const section = await tx.mwbSection.create({
						data: {
							weekId: week.id,
							name: sectionInput.name,
							code: sectionCode(sectionInput.code),
							sortOrder: sectionInput.sortOrder,
						},
						select: {
							id: true,
						},
					});

					sectionsCreated += 1;

					if (sectionInput.parts.length === 0) {
						continue;
					}

					await tx.mwbPart.createMany({
						data: sectionInput.parts.map((part) => ({
							sectionId: section.id,
							sortOrder: part.sortOrder,
							title: part.title,
							theme: part.theme ?? null,
							durationMin: part.durationMin ?? null,
							modality: part.modality ?? null,
							source: part.source ?? null,
						})),
					});

					partsCreated += sectionInput.parts.length;
				}
			}

			return {
				issueId: issue.id,
				issuesUpserted: 1,
				weeksUpserted,
				sectionsCreated,
				partsCreated,
			};
		});
	}

	async listIssues(locale?: ContentLocale): Promise<MwbIssueEntity[]> {
		const rows = await db.mwbIssue.findMany({
			where: locale ? { locale } : undefined,
			orderBy: [{ year: "desc" }, { month: "desc" }, { symbol: "desc" }],
			include: {
				weeks: {
					orderBy: {
						weekStart: "asc",
					},
					include: {
						sections: {
							orderBy: {
								sortOrder: "asc",
							},
							include: {
								parts: {
									orderBy: {
										sortOrder: "asc",
									},
								},
							},
						},
					},
				},
			},
		});

		return rows.map((row) => mapIssue(row));
	}

	async countByLocale(): Promise<MwbLocaleCount[]> {
		const rows = await db.mwbIssue.groupBy({
			by: ["locale"],
			_count: {
				_all: true,
			},
		});

		return rows.map((row) => ({
			locale: row.locale,
			count: row._count._all,
		}));
	}

	async deleteIssue(id: string): Promise<boolean> {
		try {
			await db.mwbIssue.delete({
				where: { id },
			});

			return true;
		} catch {
			return false;
		}
	}

	async deleteIssuesByLocale(locale: ContentLocale): Promise<number> {
		const result = await db.mwbIssue.deleteMany({
			where: { locale },
		});

		return result.count;
	}

	private async upsertIssue(
		tx: Prisma.TransactionClient,
		data: MwbExtract,
	): Promise<{ id: string }> {
		/*
		 * Não usamos tx.mwbIssue.upsert porque o Prisma gerado atualmente
		 * não possui a chave composta `symbol_locale` em MwbIssueWhereUniqueInput.
		 *
		 * O schema ainda deve manter @@unique([symbol, locale]) para proteção
		 * no banco; depois de prisma generate, você pode voltar ao upsert nativo
		 * se o nome gerado estiver disponível.
		 */
		const existingIssue = await tx.mwbIssue.findFirst({
			where: {
				symbol: data.symbol,
				locale: data.locale,
			},
			select: {
				id: true,
			},
		});

		if (existingIssue) {
			return tx.mwbIssue.update({
				where: {
					id: existingIssue.id,
				},
				data: {
					title: data.title,
					coverTitle: data.coverTitle ?? null,
					year: data.year ?? null,
					month: data.month ?? null,
				},
				select: {
					id: true,
				},
			});
		}

		return tx.mwbIssue.create({
			data: {
				locale: data.locale,
				symbol: data.symbol,
				title: data.title,
				coverTitle: data.coverTitle ?? null,
				year: data.year ?? null,
				month: data.month ?? null,
			},
			select: {
				id: true,
			},
		});
	}

	private async findSongId(
		tx: Prisma.TransactionClient,
		locale: ContentLocale,
		songNumber: number | null,
	): Promise<string | null> {
		if (songNumber === null) {
			return null;
		}

		const song = await tx.song.findUnique({
			where: {
				number_locale: {
					number: songNumber,
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
