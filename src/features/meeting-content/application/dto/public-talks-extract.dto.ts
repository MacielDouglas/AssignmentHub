import { z } from "zod";

const TalkSchema = z.object({
	number: z.coerce.number().int().min(1).max(999),
	title: z.string().trim().min(1).max(300),
});

export const PublicTalksExtractSchema = z.object({
	locale: z.enum(["pt", "es"]),
	talks: z.array(TalkSchema).max(500).default([]),
	notes: z
		.preprocess((v) => {
			if (v == null || v === undefined) return null;
			if (typeof v !== "string") return null;
			const t = v.trim().slice(0, 2000);
			return t || null;
		}, z.string().max(2000).nullable())
		.optional()
		.nullable(),
});

export type PublicTalksExtract = z.infer<typeof PublicTalksExtractSchema>;
export type PublicTalkExtractItem = z.infer<typeof TalkSchema>;

export const PublicTalksExtractCommitSchema = z.object({
	locale: z.enum(["pt", "es"]),
	talks: z.array(TalkSchema).min(1).max(500),
	notes: z.string().max(2000).nullable().optional(),
});

export function sanitizePublicTalksExtract(
	data: PublicTalksExtract,
): PublicTalksExtract {
	const seen = new Set<number>();
	const talks: PublicTalkExtractItem[] = [];

	for (const raw of data.talks) {
		const number = Math.trunc(Number(raw.number));
		const title = String(raw.title ?? "")
			.replace(/\s+/g, " ")
			.trim();
		if (!Number.isFinite(number) || number < 1 || number > 999) continue;
		if (!title) continue;
		if (seen.has(number)) continue;
		seen.add(number);
		talks.push({ number, title });
	}

	talks.sort((a, b) => a.number - b.number);

	return {
		locale: data.locale,
		talks,
		notes: data.notes ?? null,
	};
}
