import type {
	ContentLocale,
	MeetingKind,
	MeetingProgramPartKind,
	MeetingProgramSectionCode,
	Prisma,
} from "@/generated/prisma/client";

import { db } from "@/lib/db";
import { resolveOrganizationWeekSchedule } from "./meeting-schedule.service";
import { endOfWeekSunday, toIsoDateOnly } from "./meeting-week-dates";

type GeneratedPart = {
	kind: MeetingProgramPartKind;
	sectionCode: MeetingProgramSectionCode | null;
	sortOrder: number;
	title: string;
	theme?: string | null;
	durationMin?: number | null;
	modality?: string | null;
	source?: string | null;
	songNumber?: number | null;
	songTitle?: string | null;
	customTitle?: string | null;
	sourceMwbPartId?: string | null;
	isDisabled?: boolean;
};

type GenerationInput = {
	organizationId: string;
	weekStart: Date;
	locale: ContentLocale;
};

type GeneratedProgram = {
	id: string;
	kind: MeetingKind;
};

const MIDWEEK_PREFIX_PARTS: GeneratedPart[] = [
	{
		kind: "MIDWEEK_DAY",
		sectionCode: null,
		sortOrder: 0,
		title: "Dia da reunião",
	},
	{
		kind: "MIDWEEK_CHAIRMAN",
		sectionCode: null,
		sortOrder: 10,
		title: "Presidente",
	},
	{
		kind: "MIDWEEK_OPENING_SONG",
		sectionCode: null,
		sortOrder: 20,
		title: "Cântico inicial e oração",
	},
	{
		kind: "MIDWEEK_INTRODUCTION",
		sectionCode: "TREASURES",
		sortOrder: 30,
		title: "Introdução",
		durationMin: 1,
	},
];

const WEEKEND_PREFIX_PARTS: GeneratedPart[] = [
	{
		kind: "WEEKEND_CHAIRMAN",
		sectionCode: null,
		sortOrder: 10,
		title: "Presidente",
	},
	{
		kind: "WEEKEND_OPENING_SONG",
		sectionCode: null,
		sortOrder: 20,
		title: "Cântico inicial e oração",
	},
];

function dateAtTime(date: Date, time: string | null): Date | null {
	if (!time) {
		return null;
	}

	const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);

	if (!match) {
		return null;
	}

	const result = new Date(date);
	result.setUTCHours(Number(match[1]), Number(match[2]), 0, 0);

	return result;
}

function nextSortOrder(current: number) {
	return current + 10;
}

function sectionCodeFromMwb(
	code: "TREASURES" | "APPLY" | "LIVING" | null,
): MeetingProgramSectionCode {
	if (code === "TREASURES") {
		return "TREASURES";
	}

	if (code === "APPLY") {
		return "MINISTRY";
	}

	return "LIVING";
}

function normalizeText(value: string | null | undefined) {
	const text = value?.trim();

	return text ? text : null;
}

function songLabel(number: number | null, title: string | null) {
	if (!number) {
		return null;
	}

	return title ? `Cântico ${number} — ${title}` : `Cântico ${number}`;
}

function findSongTitle(
	songs: Array<{
		number: number;
		title: string;
	}>,
	number: number | null,
) {
	if (!number) {
		return null;
	}

	return songs.find((song) => song.number === number)?.title ?? null;
}

function createMwbPartKind(input: {
	sectionCode: "TREASURES" | "APPLY" | "LIVING" | null;
	title: string;
	modality: string | null;
	sortOrder: number;
}): MeetingProgramPartKind {
	const normalizedTitle = input.title.toLocaleLowerCase();
	const normalizedModality = input.modality?.toLocaleLowerCase() ?? "";

	if (input.sectionCode === "TREASURES") {
		if (
			normalizedTitle.includes("pérolas") ||
			normalizedTitle.includes("perlas") ||
			normalizedTitle.includes("gemas")
		) {
			return "MIDWEEK_SPIRITUAL_GEMS";
		}

		if (
			normalizedTitle.includes("leitura da bíblia") ||
			normalizedTitle.includes("lectura de la biblia") ||
			normalizedTitle.includes("lectura bíblica") ||
			normalizedTitle.includes("lectura de la biblia")
		) {
			return "MIDWEEK_BIBLE_READING";
		}

		return "MIDWEEK_TREASURES_TALK";
	}

	if (input.sectionCode === "APPLY") {
		if (
			normalizedTitle.includes("comece conversas") ||
			normalizedTitle.includes("empiece conversaciones") ||
			normalizedTitle.includes("inicie conversaciones")
		) {
			return "MIDWEEK_MINISTRY_INITIATING_CONVERSATION";
		}

		if (
			normalizedTitle.includes("faça revisitas") ||
			normalizedTitle.includes("haga revisitas")
		) {
			return "MIDWEEK_MINISTRY_CULTIVATING_INTEREST";
		}

		if (
			normalizedTitle.includes("faça discípulos") ||
			normalizedTitle.includes("haga discípulos")
		) {
			return "MIDWEEK_MINISTRY_MAKING_DISCIPLES";
		}

		if (
			normalizedTitle.includes("explique suas crenças") ||
			normalizedTitle.includes("explique sus creencias")
		) {
			return "MIDWEEK_MINISTRY_EXPLAINING_BELIEFS";
		}

		if (
			normalizedTitle.includes("discurso") ||
			normalizedModality.includes("discurso")
		) {
			return "MIDWEEK_MINISTRY_TALK";
		}

		return "MIDWEEK_MINISTRY_TALK";
	}

	if (
		normalizedTitle.includes("realizações da organização") ||
		normalizedTitle.includes("logros de la organización") ||
		normalizedTitle.includes("conquistas da organização")
	) {
		return "MIDWEEK_ORGANIZATION_ACCOMPLISHMENTS";
	}

	if (
		normalizedTitle.includes("estudo bíblico de congregação") ||
		normalizedTitle.includes("estudio bíblico de la congregación")
	) {
		return "MIDWEEK_BIBLE_STUDY";
	}

	return "MIDWEEK_LIVING_PART";
}

async function getMwbWeek(input: {
	organizationId: string;
	weekStart: Date;
	locale: ContentLocale;
}) {
	return db.mwbWeek.findFirst({
		where: {
			weekStart: input.weekStart,
			issue: {
				locale: input.locale,
				OR: [
					{
						organizationId: input.organizationId,
					},
					{
						organizationId: null,
					},
				],
			},
		},
		include: {
			issue: {
				select: {
					organizationId: true,
				},
			},
			openingSong: {
				select: {
					number: true,
					title: true,
				},
			},
			middleSong: {
				select: {
					number: true,
					title: true,
				},
			},
			closingSong: {
				select: {
					number: true,
					title: true,
				},
			},
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
		orderBy: {
			issue: {
				organizationId: "desc",
			},
		},
	});
}

async function getWatchtowerStudy(input: {
	weekStart: Date;
	locale: ContentLocale;
}) {
	return db.watchtowerStudy.findFirst({
		where: {
			weekStart: input.weekStart,
			locale: input.locale,
		},
		include: {
			openingSong: {
				select: {
					number: true,
					title: true,
				},
			},
			closingSong: {
				select: {
					number: true,
					title: true,
				},
			},
		},
	});
}

function buildMidweekParts(input: {
	mwbWeek: Awaited<ReturnType<typeof getMwbWeek>>;
	locale: ContentLocale;
	scheduledTime: string | null;
	isDisabled: boolean;
}): GeneratedPart[] {
	const { mwbWeek, scheduledTime, isDisabled } = input;

	if (!mwbWeek) {
		return [
			...MIDWEEK_PREFIX_PARTS.map((part) => ({
				...part,
				isDisabled,
			})),
			{
				kind: "MIDWEEK_CONCLUSION",
				sectionCode: null,
				sortOrder: 90,
				title: "Conclusão",
				durationMin: 3,
				isDisabled,
			},
			{
				kind: "MIDWEEK_CLOSING_SONG_AND_PRAYER",
				sectionCode: null,
				sortOrder: 100,
				title: "Cântico final e oração",
				isDisabled,
			},
		];
	}

	const openingSongNumber = mwbWeek.openingSongNum;
	const middleSongNumber = mwbWeek.middleSongNum;
	const closingSongNumber = mwbWeek.closingSongNum;

	const openingSongTitle =
		mwbWeek.openingSong?.title ??
		findSongTitle(
			[
				...(mwbWeek.openingSong ? [mwbWeek.openingSong] : []),
				...(mwbWeek.middleSong ? [mwbWeek.middleSong] : []),
				...(mwbWeek.closingSong ? [mwbWeek.closingSong] : []),
			],
			openingSongNumber,
		);

	const middleSongTitle =
		mwbWeek.middleSong?.title ??
		findSongTitle(
			[
				...(mwbWeek.openingSong ? [mwbWeek.openingSong] : []),
				...(mwbWeek.middleSong ? [mwbWeek.middleSong] : []),
				...(mwbWeek.closingSong ? [mwbWeek.closingSong] : []),
			],
			middleSongNumber,
		);

	const closingSongTitle =
		mwbWeek.closingSong?.title ??
		findSongTitle(
			[
				...(mwbWeek.openingSong ? [mwbWeek.openingSong] : []),
				...(mwbWeek.middleSong ? [mwbWeek.middleSong] : []),
				...(mwbWeek.closingSong ? [mwbWeek.closingSong] : []),
			],
			closingSongNumber,
		);

	const parts: GeneratedPart[] = [
		{
			...MIDWEEK_PREFIX_PARTS[0],
			title: scheduledTime
				? `Reunião do meio de semana — ${scheduledTime}`
				: "Reunião do meio de semana",
			isDisabled,
		},
		{
			...MIDWEEK_PREFIX_PARTS[1],
			isDisabled,
		},
		{
			...MIDWEEK_PREFIX_PARTS[2],
			songNumber: openingSongNumber,
			songTitle: openingSongTitle,
			title:
				songLabel(openingSongNumber, openingSongTitle) ??
				"Cântico inicial e oração",
			isDisabled,
		},
		{
			...MIDWEEK_PREFIX_PARTS[3],
			isDisabled,
		},
	];

	let sortOrder = 40;
	let insertedMiddleSong = false;

	for (const section of mwbWeek.sections) {
		const sectionCode = sectionCodeFromMwb(section.code);

		for (const part of section.parts) {
			parts.push({
				kind: createMwbPartKind({
					sectionCode: section.code,
					title: part.title,
					modality: part.modality,
					sortOrder: part.sortOrder,
				}),
				sectionCode,
				sortOrder,
				title: part.title,
				theme: normalizeText(part.theme),
				durationMin: part.durationMin,
				modality: normalizeText(part.modality),
				source: normalizeText(part.source),
				sourceMwbPartId: part.id,
				isDisabled,
			});

			sortOrder = nextSortOrder(sortOrder);
		}

		if (!insertedMiddleSong && section.code === "APPLY" && middleSongNumber) {
			parts.push({
				kind: "MIDWEEK_MIDDLE_SONG",
				sectionCode: "LIVING",
				sortOrder,
				title:
					songLabel(middleSongNumber, middleSongTitle) ?? "Cântico do meio",
				songNumber: middleSongNumber,
				songTitle: middleSongTitle,
				isDisabled,
			});

			sortOrder = nextSortOrder(sortOrder);
			insertedMiddleSong = true;
		}
	}

	if (!insertedMiddleSong && middleSongNumber) {
		parts.push({
			kind: "MIDWEEK_MIDDLE_SONG",
			sectionCode: "LIVING",
			sortOrder,
			title: songLabel(middleSongNumber, middleSongTitle) ?? "Cântico do meio",
			songNumber: middleSongNumber,
			songTitle: middleSongTitle,
			isDisabled,
		});

		sortOrder = nextSortOrder(sortOrder);
	}

	parts.push(
		{
			kind: "MIDWEEK_CONCLUSION",
			sectionCode: null,
			sortOrder,
			title: "Conclusão",
			durationMin: 3,
			isDisabled,
		},
		{
			kind: "MIDWEEK_CLOSING_SONG_AND_PRAYER",
			sectionCode: null,
			sortOrder: nextSortOrder(sortOrder),
			title:
				songLabel(closingSongNumber, closingSongTitle) ??
				"Cântico final e oração",
			songNumber: closingSongNumber,
			songTitle: closingSongTitle,
			isDisabled,
		},
	);

	return parts;
}

function buildWeekendParts(input: {
	watchtowerStudy: Awaited<ReturnType<typeof getWatchtowerStudy>>;
	isDisabled: boolean;
	specialTalkTitle: string | null;
	circuitOverseerTitle: string | null;
}): GeneratedPart[] {
	const {
		watchtowerStudy,
		isDisabled,
		specialTalkTitle,
		circuitOverseerTitle,
	} = input;

	const openingSongNumber = watchtowerStudy?.openingSongNum ?? null;
	const openingSongTitle = watchtowerStudy?.openingSong?.title ?? null;
	const closingSongNumber = watchtowerStudy?.closingSongNum ?? null;
	const closingSongTitle = watchtowerStudy?.closingSong?.title ?? null;

	const parts: GeneratedPart[] = [
		{
			...WEEKEND_PREFIX_PARTS[0],
			isDisabled,
		},
		{
			...WEEKEND_PREFIX_PARTS[1],
			songNumber: openingSongNumber,
			songTitle: openingSongTitle,
			title:
				songLabel(openingSongNumber, openingSongTitle) ??
				"Cântico inicial e oração",
			isDisabled,
		},
		{
			kind: "WEEKEND_PUBLIC_TALK",
			sectionCode: "PUBLIC_TALK",
			sortOrder: 30,
			title: specialTalkTitle ?? "Discurso público",
			customTitle: specialTalkTitle,
			durationMin: 30,
			isDisabled,
		},
	];

	if (circuitOverseerTitle) {
		parts.push({
			kind: "WEEKEND_CIRCUIT_OVERSEER_FINAL_TALK",
			sectionCode: "PUBLIC_TALK",
			sortOrder: 40,
			title: circuitOverseerTitle,
			customTitle: circuitOverseerTitle,
			durationMin: 30,
			isDisabled,
		});
	}

	parts.push(
		{
			kind: "WEEKEND_WATCHTOWER_STUDY",
			sectionCode: "WATCHTOWER",
			sortOrder: 50,
			title: watchtowerStudy?.title ?? "Estudo de A Sentinela",
			theme: watchtowerStudy?.weekLabelRaw ?? null,
			source: watchtowerStudy?.issueCode ?? null,
			isDisabled,
		},
		{
			kind: "WEEKEND_CLOSING_SONG_AND_PRAYER",
			sectionCode: null,
			sortOrder: 60,
			title:
				songLabel(closingSongNumber, closingSongTitle) ??
				"Cântico final e oração",
			songNumber: closingSongNumber,
			songTitle: closingSongTitle,
			isDisabled,
		},
	);

	return parts;
}

async function upsertProgramParts(
	tx: Prisma.TransactionClient,
	input: {
		meetingProgramId: string;
		parts: GeneratedPart[];
	},
) {
	const existingParts = await tx.meetingProgramPart.findMany({
		where: {
			meetingProgramId: input.meetingProgramId,
		},
		select: {
			id: true,
			kind: true,
			sortOrder: true,
			assignments: {
				select: {
					id: true,
				},
				take: 1,
			},
		},
	});

	const existingByKindAndOrder = new Map(
		existingParts.map((part) => [`${part.kind}:${part.sortOrder}`, part]),
	);

	const incomingKeys = new Set(
		input.parts.map((part) => `${part.kind}:${part.sortOrder}`),
	);

	for (const part of input.parts) {
		const key = `${part.kind}:${part.sortOrder}`;
		const existing = existingByKindAndOrder.get(key);

		const data = {
			kind: part.kind,
			sectionCode: part.sectionCode,
			sortOrder: part.sortOrder,
			title: part.title,
			theme: part.theme ?? null,
			durationMin: part.durationMin ?? null,
			modality: part.modality ?? null,
			source: part.source ?? null,
			songNumber: part.songNumber ?? null,
			songTitle: part.songTitle ?? null,
			customTitle: part.customTitle ?? null,
			sourceMwbPartId: part.sourceMwbPartId ?? null,
			isDisabled: part.isDisabled ?? false,
		};

		if (existing) {
			await tx.meetingProgramPart.update({
				where: {
					id: existing.id,
				},
				data,
			});

			continue;
		}

		await tx.meetingProgramPart.create({
			data: {
				meetingProgramId: input.meetingProgramId,
				...data,
			},
		});
	}

	const removablePartIds = existingParts
		.filter((part) => {
			const key = `${part.kind}:${part.sortOrder}`;

			return !incomingKeys.has(key) && part.assignments.length === 0;
		})
		.map((part) => part.id);

	if (removablePartIds.length > 0) {
		await tx.meetingProgramPart.deleteMany({
			where: {
				id: {
					in: removablePartIds,
				},
			},
		});
	}
}

async function upsertMeetingProgram(
	tx: Prisma.TransactionClient,
	input: {
		organizationId: string;
		weekStart: Date;
		weekEnd: Date;
		kind: MeetingKind;
		locale: ContentLocale;
		sourceMwbWeekId?: string | null;
		sourceWatchtowerStudyId?: string | null;
		scheduledAt: Date | null;
		scheduledTime: string | null;
		isCancelled: boolean;
		cancellationReason: string | null;
		specialEventTitle: string | null;
		specialEventDate: Date | null;
		specialEventTime: string | null;
		specialEventLocation: string | null;
		specialEventNotes: string | null;
		parts: GeneratedPart[];
	},
): Promise<GeneratedProgram> {
	const existing = await tx.meetingProgram.findUnique({
		where: {
			organizationId_weekStart_kind: {
				organizationId: input.organizationId,
				weekStart: input.weekStart,
				kind: input.kind,
			},
		},
		select: {
			id: true,
		},
	});

	const programData = {
		weekEnd: input.weekEnd,
		locale: input.locale,
		sourceMwbWeekId: input.sourceMwbWeekId ?? null,
		sourceWatchtowerStudyId: input.sourceWatchtowerStudyId ?? null,
		scheduledAt: input.scheduledAt,
		scheduledTime: input.scheduledTime,
		isCancelled: input.isCancelled,
		cancellationReason: input.cancellationReason,
		specialEventTitle: input.specialEventTitle,
		specialEventDate: input.specialEventDate,
		specialEventTime: input.specialEventTime,
		specialEventLocation: input.specialEventLocation,
		specialEventNotes: input.specialEventNotes,
	};

	const program = existing
		? await tx.meetingProgram.update({
				where: {
					id: existing.id,
				},
				data: programData,
				select: {
					id: true,
					kind: true,
				},
			})
		: await tx.meetingProgram.create({
				data: {
					organizationId: input.organizationId,
					weekStart: input.weekStart,
					kind: input.kind,
					...programData,
				},
				select: {
					id: true,
					kind: true,
				},
			});

	await upsertProgramParts(tx, {
		meetingProgramId: program.id,
		parts: input.parts,
	});

	return program;
}

export async function generateMeetingProgramsForWeek(
	input: GenerationInput,
): Promise<{
	weekStart: string;
	weekEnd: string;
	midweek: GeneratedProgram;
	weekend: GeneratedProgram;
}> {
	const weekEnd = endOfWeekSunday(input.weekStart);

	const [mwbWeek, watchtowerStudy, schedule] = await Promise.all([
		getMwbWeek(input),
		getWatchtowerStudy(input),
		resolveOrganizationWeekSchedule(input.organizationId, input.weekStart),
	]);

	const midweekScheduledAt = dateAtTime(
		schedule.midweek?.date ?? input.weekStart,
		schedule.midweek?.time ?? null,
	);

	const weekendScheduledAt = dateAtTime(
		schedule.weekend?.date ?? weekEnd,
		schedule.weekend?.time ?? null,
	);

	const blockAllMeetings = schedule.blockingEvent !== null;

	const midweekCelebration =
		schedule.celebration !== null &&
		schedule.midweek !== null &&
		schedule.celebration.occurrence.startDate.toISOString().slice(0, 10) ===
			schedule.midweek.date.toISOString().slice(0, 10);

	const weekendCelebration =
		schedule.celebration !== null &&
		schedule.weekend !== null &&
		schedule.celebration.occurrence.startDate.toISOString().slice(0, 10) ===
			schedule.weekend.date.toISOString().slice(0, 10);

	const midweekIsCancelled = blockAllMeetings || midweekCelebration;
	const weekendIsCancelled =
		blockAllMeetings || weekendCelebration || schedule.specialMeeting !== null;

	const specialMeeting = schedule.specialMeeting;
	const circuitOverseer = schedule.travelingOverseerVisit;

	const midweekParts = buildMidweekParts({
		mwbWeek,
		locale: input.locale,
		scheduledTime: schedule.midweek?.time ?? null,
		isDisabled: midweekIsCancelled,
	});

	const weekendParts = buildWeekendParts({
		watchtowerStudy,
		isDisabled: weekendIsCancelled,
		specialTalkTitle: specialMeeting?.title ?? null,
		circuitOverseerTitle: circuitOverseer?.title ?? null,
	});

	const cancellationReason =
		schedule.blockingEvent?.title ??
		schedule.celebration?.title ??
		specialMeeting?.title ??
		null;

	const [midweek, weekend] = await db.$transaction(async (tx) => {
		const generatedMidweek = await upsertMeetingProgram(tx, {
			organizationId: input.organizationId,
			weekStart: input.weekStart,
			weekEnd,
			kind: "MIDWEEK",
			locale: input.locale,
			sourceMwbWeekId: mwbWeek?.id ?? null,
			scheduledAt: midweekScheduledAt,
			scheduledTime: schedule.midweek?.time ?? null,
			isCancelled: midweekIsCancelled,
			cancellationReason: midweekIsCancelled ? cancellationReason : null,
			specialEventTitle:
				schedule.celebration?.title ?? schedule.blockingEvent?.title ?? null,
			specialEventDate:
				schedule.celebration?.occurrence.startDate ??
				schedule.blockingEvent?.occurrence.startDate ??
				null,
			specialEventTime:
				schedule.celebration?.occurrence.time ??
				schedule.blockingEvent?.occurrence.time ??
				null,
			specialEventLocation:
				schedule.celebration?.occurrence.location ??
				schedule.blockingEvent?.occurrence.location ??
				null,
			specialEventNotes:
				schedule.celebration?.occurrence.notes ??
				schedule.blockingEvent?.occurrence.notes ??
				null,
			parts: midweekParts,
		});

		const generatedWeekend = await upsertMeetingProgram(tx, {
			organizationId: input.organizationId,
			weekStart: input.weekStart,
			weekEnd,
			kind: "WEEKEND",
			locale: input.locale,
			sourceWatchtowerStudyId: watchtowerStudy?.id ?? null,
			scheduledAt: weekendScheduledAt,
			scheduledTime: schedule.weekend?.time ?? null,
			isCancelled: weekendIsCancelled,
			cancellationReason: weekendIsCancelled ? cancellationReason : null,
			specialEventTitle:
				specialMeeting?.title ??
				schedule.celebration?.title ??
				schedule.blockingEvent?.title ??
				null,
			specialEventDate:
				specialMeeting?.occurrence.startDate ??
				schedule.celebration?.occurrence.startDate ??
				schedule.blockingEvent?.occurrence.startDate ??
				null,
			specialEventTime:
				specialMeeting?.occurrence.time ??
				schedule.celebration?.occurrence.time ??
				schedule.blockingEvent?.occurrence.time ??
				null,
			specialEventLocation:
				specialMeeting?.occurrence.location ??
				schedule.celebration?.occurrence.location ??
				schedule.blockingEvent?.occurrence.location ??
				null,
			specialEventNotes:
				specialMeeting?.occurrence.notes ??
				schedule.celebration?.occurrence.notes ??
				schedule.blockingEvent?.occurrence.notes ??
				null,
			parts: weekendParts,
		});

		return [generatedMidweek, generatedWeekend];
	});

	return {
		weekStart: toIsoDateOnly(input.weekStart),
		weekEnd: toIsoDateOnly(weekEnd),
		midweek,
		weekend,
	};
}
