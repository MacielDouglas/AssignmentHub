import { z } from "zod";

const isoDate = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
	.nullable();

const hexColor = z
	.string()
	.regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve ser #RRGGBB")
	.nullable();

/** Aceita "3", "03", "Cântico 3", 3.0 → number | null */
function coerceSongNumber(value: unknown): number | null {
	if (value === null || value === undefined || value === "") return null;
	if (typeof value === "number" && Number.isFinite(value)) {
		const n = Math.trunc(value);
		return n >= 1 && n <= 999 ? n : null;
	}
	if (typeof value === "string") {
		const match = value.replace(",", ".").match(/(\d{1,3})/);
		if (!match) return null;
		const n = Number(match[1]);
		return n >= 1 && n <= 999 ? n : null;
	}
	return null;
}

const SongNumberSchema = z.preprocess(
	coerceSongNumber,
	z.number().int().min(1).max(999).nullable(),
);

export const WatchtowerArticleSchema = z.object({
	weekLabelRaw: z
		.string()
		.trim()
		.max(200)
		.catch("")
		.transform((v) => v.replace(/[<>]/g, "")),
	weekStart: isoDate.catch(null),
	weekEnd: isoDate.catch(null),
	title: z
		.string()
		.trim()
		.max(500)
		.catch("")
		.transform((v) => v.replace(/[<>]/g, "")),
	openingSong: SongNumberSchema,
	closingSong: SongNumberSchema,
	highlightColor: z.preprocess((v) => {
		if (v === null || v === undefined || v === "") return null;
		if (typeof v !== "string") return null;
		const t = v.trim();
		if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t;
		if (/^[0-9A-Fa-f]{6}$/.test(t)) return `#${t}`;
		return null;
	}, hexColor.catch(null)),
});

export const WatchtowerExtractSchema = z.object({
	locale: z.enum(["pt", "es"]),
	issueCode: z.preprocess((v) => {
		if (v === null || v === undefined || v === "") return null;
		if (typeof v !== "string") return null;
		return v.trim().replace(/[<>]/g, "").slice(0, 64) || null;
	}, z.string().max(64).nullable()),
	articles: z.array(WatchtowerArticleSchema).max(40).default([]),
	notes: z.preprocess((v) => {
		if (v === null || v === undefined) return null;
		if (typeof v !== "string") return null;
		const t = v.trim().slice(0, 2000);
		return t || null;
	}, z.string().max(2000).nullable()),
});

export type WatchtowerExtract = z.infer<typeof WatchtowerExtractSchema>;
export type WatchtowerArticle = z.infer<typeof WatchtowerArticleSchema>;

export function sanitizeWatchtowerExtract(
	data: WatchtowerExtract,
): WatchtowerExtract {
	const articles = data.articles
		.map((a) => ({
			...a,
			title: a.title.trim(),
			weekLabelRaw: a.weekLabelRaw.trim(),
		}))
		.filter(
			(a) =>
				a.title.length > 0 &&
				a.openingSong !== null &&
				a.closingSong !== null &&
				a.openingSong >= 1 &&
				a.closingSong >= 1,
		)
		.map((a) => ({
			...a,
			openingSong: a.openingSong as number,
			closingSong: a.closingSong as number,
		}));

	return { ...data, articles };
}

export const WatchtowerArticleCommitSchema = z.object({
	weekLabelRaw: z.string().trim().max(200),
	weekStart: isoDate,
	weekEnd: isoDate,
	title: z.string().trim().min(1).max(500),
	openingSong: z.number().int().min(1).max(999),
	closingSong: z.number().int().min(1).max(999),
	highlightColor: hexColor,
});

export const WatchtowerExtractCommitSchema = z.object({
	locale: z.enum(["pt", "es"]),
	issueCode: z.string().max(64).nullable(),
	articles: z.array(WatchtowerArticleCommitSchema).min(1).max(40),
	notes: z.string().max(2000).nullable(),
});

export const DeleteIdsSchema = z.object({
	ids: z.array(z.string().uuid()).min(1).max(200),
});

export const JobIdSchema = z.object({
	jobId: z.string().uuid(),
});

export const LocaleOptionalSchema = z.object({
	locale: z.enum(["pt", "es"]).optional(),
});

export const WatchtowerStudyUpdateSchema = z.object({
  id: z.string().uuid(),

  locale: z.enum(["pt", "es"]),

  weekLabelRaw: z.string().trim().min(1).max(200),

  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use AAAA-MM-DD"),

  weekEnd: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use AAAA-MM-DD"),

  title: z.string().trim().min(1).max(500),

  openingSong: z.number().int().min(1).max(999),

  closingSong: z.number().int().min(1).max(999),

  highlightColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato #RRGGBB")
    .nullable(),

  issueCode: z.string().trim().max(64).nullable(),
});

export type WatchtowerStudyUpdateInput = z.infer<
  typeof WatchtowerStudyUpdateSchema
>;
