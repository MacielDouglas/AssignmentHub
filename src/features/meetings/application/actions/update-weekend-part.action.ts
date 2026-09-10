"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireMeetingContentManage } from "@/features/meeting-content/application/services/meeting-content-auth";
import { db } from "@/lib/db";

import type { ActionResult } from "./assign-meeting-part.action";

function revalidateMeetings(slug: string) {
	revalidatePath(`/org/${slug}/meetings`);
}

async function findWeekendPart(slug: string, partId: string) {
	return db.meetingProgramPart.findFirst({
		where: {
			id: partId,
			kind: {
				in: [
					"WEEKEND_OPENING_SONG",
					"WEEKEND_PUBLIC_TALK",
					"WEEKEND_WATCHTOWER_OPENING_SONG",
					"WEEKEND_WATCHTOWER_STUDY",
					"WEEKEND_CLOSING_SONG_AND_PRAYER",
				],
			},
			meetingProgram: {
				kind: "WEEKEND",
				organization: {
					slug,
				},
			},
		},
		include: {
			meetingProgram: {
				select: {
					organizationId: true,
					locale: true,
				},
			},
		},
	});
}

const SongSchema = z.object({
	slug: z.string().min(1),
	partId: z.string().min(1),
	songNumber: z.number().int().min(1).max(999),
});

export async function updateWeekendSongAction(
	input: z.infer<typeof SongSchema>,
): Promise<ActionResult> {
	try {
		await requireMeetingContentManage(input.slug);

		const parsed = SongSchema.parse(input);
		const part = await findWeekendPart(parsed.slug, parsed.partId);

		if (!part) {
			return { ok: false, error: "Parte da reunião não encontrada." };
		}

		if (
			part.kind !== "WEEKEND_OPENING_SONG" &&
			part.kind !== "WEEKEND_WATCHTOWER_OPENING_SONG" &&
			part.kind !== "WEEKEND_CLOSING_SONG_AND_PRAYER"
		) {
			return { ok: false, error: "Esta parte não é um cântico." };
		}

		const song = await db.song.findUnique({
			where: {
				number_locale: {
					number: parsed.songNumber,
					locale: part.meetingProgram.locale,
				},
			},
			select: { number: true, title: true },
		});

		const songTitle = song?.title ?? null;
		const title = songTitle
			? `Cântico ${parsed.songNumber} — ${songTitle}`
			: `Cântico ${parsed.songNumber}`;

		await db.meetingProgramPart.update({
			where: { id: part.id },
			data: {
				songNumber: parsed.songNumber,
				songTitle,
				title,
			},
		});

		revalidateMeetings(parsed.slug);

		return { ok: true, data: undefined };
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível atualizar o cântico.",
		};
	}
}

const PublicTalkSchema = z.object({
	slug: z.string().min(1),
	partId: z.string().min(1),
	talkNumber: z.number().int().min(1).max(999),
});

export async function updateWeekendPublicTalkAction(
	input: z.infer<typeof PublicTalkSchema>,
): Promise<ActionResult> {
	try {
		await requireMeetingContentManage(input.slug);

		const parsed = PublicTalkSchema.parse(input);
		const part = await findWeekendPart(parsed.slug, parsed.partId);

		if (part?.kind !== "WEEKEND_PUBLIC_TALK") {
			return { ok: false, error: "Parte do discurso não encontrada." };
		}

		const organizationId = part.meetingProgram.organizationId;
		const locale = part.meetingProgram.locale;

		const talk =
			(await db.publicTalk.findFirst({
				where: {
					organizationId,
					locale,
					number: parsed.talkNumber,
				},
				select: { id: true, number: true, title: true },
			})) ??
			(await db.publicTalk.findFirst({
				where: {
					organizationId: null,
					locale,
					number: parsed.talkNumber,
				},
				select: { id: true, number: true, title: true },
			}));

		if (!talk) {
			return {
				ok: false,
				error:
					"Discurso não encontrado no catálogo. Cadastre o número com o tema para continuar.",
			};
		}

		const title = `Discurso ${talk.number} — ${talk.title}`;

		await db.meetingProgramPart.update({
			where: { id: part.id },
			data: {
				publicTalkId: talk.id,
				title,
				customTitle: title,
			},
		});

		revalidateMeetings(parsed.slug);

		return { ok: true, data: undefined };
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível atualizar o discurso.",
		};
	}
}

const CreatePublicTalkSchema = z.object({
	slug: z.string().min(1),
	partId: z.string().min(1),
	talkNumber: z.number().int().min(1).max(999),
	title: z.string().trim().min(2).max(300),
});

export async function createWeekendPublicTalkAction(
	input: z.infer<typeof CreatePublicTalkSchema>,
): Promise<ActionResult> {
	try {
		await requireMeetingContentManage(input.slug);

		const parsed = CreatePublicTalkSchema.parse(input);
		const part = await findWeekendPart(parsed.slug, parsed.partId);

		if (part?.kind !== "WEEKEND_PUBLIC_TALK") {
			return { ok: false, error: "Parte do discurso não encontrada." };
		}

		const organizationId = part.meetingProgram.organizationId;
		const locale = part.meetingProgram.locale;
		const theme = parsed.title.trim().slice(0, 300);

		const talk = await db.publicTalk.create({
			data: {
				organizationId,
				locale,
				number: parsed.talkNumber,
				title: theme,
			},
			select: { id: true, number: true, title: true },
		});

		const title = `Discurso ${talk.number} — ${talk.title}`;

		await db.meetingProgramPart.update({
			where: { id: part.id },
			data: {
				publicTalkId: talk.id,
				title,
				customTitle: title,
			},
		});

		revalidateMeetings(parsed.slug);

		return { ok: true, data: undefined };
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível cadastrar o discurso.",
		};
	}
}

const StudyThemeSchema = z.object({
	slug: z.string().min(1),
	partId: z.string().min(1),
	title: z.string().trim().min(2).max(300),
});

export async function updateWeekendStudyThemeAction(
	input: z.infer<typeof StudyThemeSchema>,
): Promise<ActionResult> {
	try {
		await requireMeetingContentManage(input.slug);

		const parsed = StudyThemeSchema.parse(input);
		const part = await findWeekendPart(parsed.slug, parsed.partId);

		if (part?.kind !== "WEEKEND_WATCHTOWER_STUDY") {
			return { ok: false, error: "Estudo de A Sentinela não encontrado." };
		}

		await db.meetingProgramPart.update({
			where: { id: part.id },
			data: {
				title: parsed.title.trim().slice(0, 300),
			},
		});

		revalidateMeetings(parsed.slug);

		return { ok: true, data: undefined };
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível atualizar o tema do estudo.",
		};
	}
}

const SearchSchema = z.object({
	slug: z.string().min(1),
	search: z.string().trim().max(120).default(""),
});

export type WeekendTalkOption = {
	id: string;
	number: number;
	title: string;
	scope: "LOCAL" | "GLOBAL";
};

export async function searchWeekendTalksAction(
	input: z.infer<typeof SearchSchema>,
): Promise<ActionResult<WeekendTalkOption[]>> {
	try {
		await requireMeetingContentManage(input.slug);

		const parsed = SearchSchema.parse(input);
		const organization = await db.organization.findUnique({
			where: { slug: parsed.slug },
			select: { id: true },
		});

		if (!organization) {
			return { ok: false, error: "Organização não encontrada." };
		}

		const query = parsed.search.trim();
		const asNumber = Number(query);
		const hasNumber =
			query.length > 0 && Number.isInteger(asNumber) && asNumber > 0;

		const talks = await db.publicTalk.findMany({
			where: {
				AND: [
					{
						OR: [{ organizationId: organization.id }, { organizationId: null }],
					},
					...(query
						? [
								{
									OR: [
										...(hasNumber ? [{ number: asNumber }] : []),
										{
											title: {
												contains: query,
												mode: "insensitive" as const,
											},
										},
									],
								},
							]
						: []),
				],
			},
			orderBy: [{ organizationId: "desc" }, { number: "asc" }],
			take: 20,
			select: {
				id: true,
				organizationId: true,
				number: true,
				title: true,
			},
		});

		const byNumber = new Map<number, WeekendTalkOption>();

		for (const talk of talks) {
			const existing = byNumber.get(talk.number);

			if (!existing) {
				byNumber.set(talk.number, {
					id: talk.id,
					number: talk.number,
					title: talk.title,
					scope: talk.organizationId === null ? "GLOBAL" : "LOCAL",
				});
				continue;
			}

			if (talk.organizationId !== null && existing.scope === "GLOBAL") {
				byNumber.set(talk.number, {
					id: talk.id,
					number: talk.number,
					title: talk.title,
					scope: "LOCAL",
				});
			}
		}

		return {
			ok: true,
			data: [...byNumber.values()].sort((a, b) => a.number - b.number),
		};
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível buscar os discursos.",
		};
	}
}

export type WeekendSongOption = {
	number: number;
	title: string;
};

export async function searchWeekendSongsAction(
	input: z.infer<typeof SearchSchema>,
): Promise<ActionResult<WeekendSongOption[]>> {
	try {
		await requireMeetingContentManage(input.slug);

		const parsed = SearchSchema.parse(input);

		const query = parsed.search.trim();
		const asNumber = Number(query);

		const songs = await db.song.findMany({
			where: query
				? {
						OR: [
							...(Number.isInteger(asNumber) && asNumber > 0
								? [{ number: asNumber }]
								: []),
							{ title: { contains: query, mode: "insensitive" } },
						],
					}
				: undefined,
			orderBy: { number: "asc" },
			take: 20,
			select: { number: true, title: true },
		});

		return { ok: true, data: songs };
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível buscar os cânticos.",
		};
	}
}
