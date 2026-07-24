import { z } from "zod";

export const SongItemSchema = z.object({
	draftId: z.string().uuid().optional(),
	number: z.number().int().min(1).max(999),
	title: z
		.string()
		.trim()
		.min(1)
		.max(300)
		.transform((value) => value.replace(/\s+/g, " ")),
});

export const SongbookExtractSchema = z.object({
	locale: z.enum(["pt", "es"]),
	symbol: z.string().trim().max(64).nullable().optional(),
	songs: z.array(SongItemSchema).max(500).default([]),
	notes: z.string().trim().max(2000).nullable().optional(),
});

export const SongbookExtractCommitSchema = SongbookExtractSchema.extend({
	songs: z.array(SongItemSchema).min(1).max(500),
});

export type SongItem = z.infer<typeof SongItemSchema>;
export type SongbookExtract = z.infer<typeof SongbookExtractSchema>;

export function sanitizeSongbookExtract(
	data: SongbookExtract,
): SongbookExtract {
	const byNumber = new Map<number, SongItem>();

	for (const item of data.songs) {
		const title = item.title.trim();
		if (!title || item.number < 1) continue;

		byNumber.set(item.number, {
			draftId: item.draftId,
			number: item.number,
			title,
		});
	}

	const songs = [...byNumber.values()].sort((a, b) => a.number - b.number);

	return {
		locale: data.locale,
		symbol: data.symbol ?? null,
		songs,
		notes: data.notes ?? null,
	};
}
