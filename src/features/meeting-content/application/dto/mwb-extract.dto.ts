import { z } from "zod";

import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";

const MwbPartSchema = z.object({
	title: z.string().trim().min(1).max(300),
	theme: z.string().trim().max(500).nullable().optional(),
	durationMin: z.coerce.number().int().min(0).max(180).nullable().optional(),
	modality: z.string().trim().max(120).nullable().optional(),
	source: z.string().trim().max(500).nullable().optional(),
	sortOrder: z.coerce.number().int().min(0),
});

const MwbSectionSchema = z.object({
	name: z.string().trim().min(1).max(120),
	code: z.enum(["TREASURES", "APPLY", "LIVING"]).nullable().optional(),
	sortOrder: z.coerce.number().int().min(0),
	parts: z.array(MwbPartSchema).max(50),
});

const MwbWeekSchema = z.object({
	weekStart: z.string().min(10).max(10),
	weekEnd: z.string().min(10).max(10),
	weekLabelRaw: z.string().trim().max(200).nullable().optional(),
	dateRangeRaw: z.string().trim().max(100).nullable().optional(),
	openingSongNum: z.coerce.number().int().min(1).max(999).nullable().optional(),
	middleSongNum: z.coerce.number().int().min(1).max(999).nullable().optional(),
	closingSongNum: z.coerce.number().int().min(1).max(999).nullable().optional(),
	sortOrder: z.coerce.number().int().min(0),
	sections: z.array(MwbSectionSchema).min(1).max(10),
});

export const MwbExtractSchema = z.object({
	locale: z.enum(["pt", "es"]),
	symbol: z.string().trim().min(1).max(40),
	title: z.string().trim().min(1).max(300),
	coverTitle: z.string().trim().max(300).nullable().optional(),
	year: z.coerce.number().int().min(2000).max(2100).nullable().optional(),
	month: z.coerce.number().int().min(1).max(12).nullable().optional(),
	notes: z.string().trim().max(1000).nullable().optional(),
	weeks: z.array(MwbWeekSchema).min(1).max(10),
});

export const MwbExtractCommitSchema = MwbExtractSchema;

export type MwbPartExtract = z.infer<typeof MwbPartSchema>;
export type MwbSectionExtract = z.infer<typeof MwbSectionSchema>;
export type MwbWeekExtract = z.infer<typeof MwbWeekSchema>;
export type MwbExtract = z.infer<typeof MwbExtractSchema>;

function normalizeText(value: unknown): string | null {
	const text = String(value ?? "")
		.replace(/\s+/g, " ")
		.trim();
	return text ? text : null;
}

function normalizeSong(value: unknown): number | null {
	const num = Number(value);
	if (!Number.isInteger(num) || num < 1 || num > 999) return null;
	return num;
}

function normalizeDate(value: unknown): string | null {
	const text = String(value ?? "").trim();
	if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
	return text;
}

export function sanitizeMwbExtract(input: unknown): MwbExtract {
	const parsed = MwbExtractSchema.parse(input);

	const weeks = parsed.weeks
		.map((week, weekIndex) => {
			const sections = week.sections
				.map((section, sectionIndex) => {
					const parts = section.parts
						.map((part, partIndex) => ({
							title: part.title.trim(),
							theme: normalizeText(part.theme),
							durationMin:
								part.durationMin == null
									? null
									: Number.isInteger(part.durationMin)
										? part.durationMin
										: null,
							modality: normalizeText(part.modality),
							source: normalizeText(part.source),
							sortOrder: partIndex,
						}))
						.filter((part) => part.title.length > 0);

					return {
						name: section.name.trim(),
						code: section.code ?? null,
						sortOrder: sectionIndex,
						parts,
					};
				})
				.filter(
					(section) => section.name.length > 0 && section.parts.length > 0,
				);

			return {
				weekStart: normalizeDate(week.weekStart) ?? week.weekStart,
				weekEnd: normalizeDate(week.weekEnd) ?? week.weekEnd,
				weekLabelRaw: normalizeText(week.weekLabelRaw),
				dateRangeRaw: normalizeText(week.dateRangeRaw),
				openingSongNum: normalizeSong(week.openingSongNum),
				middleSongNum: normalizeSong(week.middleSongNum),
				closingSongNum: normalizeSong(week.closingSongNum),
				sortOrder: weekIndex,
				sections,
			};
		})
		.filter((week) => week.sections.length > 0);

	return {
		locale: parsed.locale as ContentLocale,
		symbol: parsed.symbol.trim(),
		title: parsed.title.trim(),
		coverTitle: normalizeText(parsed.coverTitle),
		year: parsed.year ?? null,
		month: parsed.month ?? null,
		notes: normalizeText(parsed.notes),
		weeks,
	};
}

export const JobIdSchema = z.object({
	jobId: z.string().min(1),
});

export const MwbIssueUpdateSchema = z.object({
	id: z.string().min(1),
	locale: z.enum(["pt", "es"]),
	symbol: z.string().trim().min(1).max(40),
	title: z.string().trim().min(1).max(300),
	coverTitle: z.string().trim().max(300).nullable().optional(),
	year: z.coerce.number().int().min(2000).max(2100).nullable().optional(),
	month: z.coerce.number().int().min(1).max(12).nullable().optional(),
	weeks: z.array(MwbWeekSchema).min(1).max(10),
});

export type MwbIssueUpdateInput = z.infer<typeof MwbIssueUpdateSchema>;

export function sanitizeMwbIssueUpdate(input: unknown): MwbIssueUpdateInput {
	const parsed = MwbIssueUpdateSchema.parse(input);
	const clean = sanitizeMwbExtract({
		locale: parsed.locale,
		symbol: parsed.symbol,
		title: parsed.title,
		coverTitle: parsed.coverTitle,
		year: parsed.year,
		month: parsed.month,
		notes: null,
		weeks: parsed.weeks,
	});
	return {
		id: parsed.id,
		locale: clean.locale,
		symbol: clean.symbol,
		title: clean.title,
		coverTitle: clean.coverTitle,
		year: clean.year,
		month: clean.month,
		weeks: clean.weeks,
	};
}
