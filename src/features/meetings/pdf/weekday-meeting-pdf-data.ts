import type {
	MeetingPartDto,
	MeetingProgramDto,
	MeetingWeekDto,
} from "../domain/meeting-types";
import type {
	PdfLocale,
	WeekdayMeetingPdfAssignee,
	WeekdayMeetingPdfData,
	WeekdayMeetingPdfItem,
	WeekdayMeetingPdfSection,
	WeekdayMeetingPdfSectionKey,
} from "./weekday-meeting-pdf-types";

export function cleanText(
	value: string | null | undefined,
): string | undefined {
	const text = value?.replace(/\s+/g, " ").trim();

	return text || undefined;
}

function mapRole(role: string): WeekdayMeetingPdfAssignee["role"] {
	switch (role) {
		case "CHAIRMAN":
			return "chairman";
		case "CONDUCTOR":
			return "conductor";
		case "READER":
			return "reader";
		case "ASSISTANT":
			return "assistant";
		case "PRAYER":
			return "prayer";
		default:
			return "other";
	}
}

export function extractAssignees(
	part: MeetingPartDto,
): WeekdayMeetingPdfAssignee[] {
	return part.assignments
		.map((assignment) => ({
			name: cleanText(assignment.assigneeName) ?? "",
			role: mapRole(assignment.role),
		}))
		.filter((assignment) => assignment.name.length > 0);
}

const SONG_LABELS: Record<PdfLocale, string> = {
	"pt-BR": "Cântico",
	es: "Canción",
	en: "Song",
};

export function buildSongTitle(
	part: MeetingPartDto,
	locale: PdfLocale,
): string {
	const label = SONG_LABELS[locale] ?? SONG_LABELS["pt-BR"];
	const number = cleanText(part.songNumber?.toString());
	const songTitle = cleanText(part.songTitle);
	const customTitle = cleanText(part.customTitle);
	const title = cleanText(part.title);

	if (number && songTitle) {
		return `${label} ${number} — ${songTitle}`;
	}

	if (number) {
		return `${label} ${number}`;
	}

	return customTitle ?? title ?? label;
}

function mapSectionKey(
	sectionCode: string | null,
): WeekdayMeetingPdfSectionKey | null {
	switch (sectionCode) {
		case "TREASURES":
			return "bibleTreasures";
		case "MINISTRY":
			return "applyYourself";
		case "LIVING":
			return "christianLife";
		default:
			return null;
	}
}

function mapPartToItem(
	part: MeetingPartDto,
	locale: PdfLocale,
): WeekdayMeetingPdfItem {
	const isSong = part.kind.includes("SONG");

	const emphasis: WeekdayMeetingPdfItem["emphasis"] = isSong
		? "song"
		: part.kind === "MIDWEEK_BIBLE_STUDY"
			? "study"
			: part.kind === "MIDWEEK_INTRODUCTION"
				? "opening"
				: part.kind === "MIDWEEK_CONCLUSION"
					? "conclusion"
					: "normal";

	const durationMin =
		part.kind === "MIDWEEK_MIDDLE_SONG"
			? (part.durationMin ?? 5)
			: (part.durationMin ?? undefined);

	return {
		id: part.id,
		time: undefined,
		title: isSong
			? withDurationSuffix(buildSongTitle(part, locale), durationMin)
			: withDurationSuffix(
					cleanText(part.customTitle) ?? cleanText(part.title),
					durationMin,
				),
		subtitle: undefined,
		assignees: extractAssignees(part),
		emphasis,
		durationMin,
		compactAfter: part.kind === "MIDWEEK_MIDDLE_SONG",
		gapAfterMin:
			part.kind === "MIDWEEK_BIBLE_READING" ||
			part.kind.startsWith("MIDWEEK_MINISTRY")
				? 1
				: undefined,
	};
}

export function withDurationSuffix(
	title: string | undefined,
	durationMin: number | null | undefined,
): string | undefined {
	const text = cleanText(title);

	if (!text) {
		return undefined;
	}

	if (durationMin === null || durationMin === undefined || durationMin <= 0) {
		return text;
	}

	return `${text} (${durationMin}min)`;
}

function parseTimeToMinutes(value: string | null | undefined): number | null {
	const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec((value ?? "").trim());

	if (!match) {
		return null;
	}

	return Number(match[1]) * 60 + Number(match[2]);
}

function formatMinutesToTime(total: number): string {
	const normalized = ((total % 1440) + 1440) % 1440;

	return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(
		normalized % 60,
	).padStart(2, "0")}`;
}

export function assignPartTimes(
	items: Array<WeekdayMeetingPdfItem | undefined>,
	startTime: string | null | undefined,
): void {
	const start = parseTimeToMinutes(startTime);

	if (start === null) {
		return;
	}

	let cursor = start;

	for (const item of items) {
		if (!item) {
			continue;
		}

		item.time = formatMinutesToTime(cursor);
		cursor += (item.durationMin ?? 0) + (item.gapAfterMin ?? 0);
	}
}

function findTreasuresSubtitle(items: MeetingPartDto[]): string | undefined {
	const partWithTheme = items.find((item) => cleanText(item.theme));

	return partWithTheme ? cleanText(partWithTheme.theme) : undefined;
}

function groupPartsIntoSections(
	parts: MeetingPartDto[],
	locale: PdfLocale,
): WeekdayMeetingPdfSection[] {
	const sectionMap = new Map<WeekdayMeetingPdfSectionKey, MeetingPartDto[]>();

	for (const part of parts) {
		if (part.isDisabled) {
			continue;
		}

		const key = mapSectionKey(part.sectionCode);

		if (!key) {
			continue;
		}

		const current = sectionMap.get(key) ?? [];
		current.push(part);
		sectionMap.set(key, current);
	}

	const order: WeekdayMeetingPdfSectionKey[] = [
		"bibleTreasures",
		"applyYourself",
		"christianLife",
	];

	return order.flatMap((key) => {
		const sectionParts = sectionMap.get(key) ?? [];

		if (sectionParts.length === 0) {
			return [];
		}

		const items = sectionParts.map((part) => mapPartToItem(part, locale));

		return [
			{
				key,
				subtitle:
					key === "bibleTreasures"
						? findTreasuresSubtitle(sectionParts)
						: undefined,
				items,
			},
		];
	});
}

const OPENING_KINDS = new Set([
	"MIDWEEK_CHAIRMAN",
	"MIDWEEK_OPENING_SONG",
	"MIDWEEK_INTRODUCTION",
]);

const CLOSING_KINDS = new Set([
	"MIDWEEK_CONCLUSION",
	"MIDWEEK_CLOSING_SONG_AND_PRAYER",
]);

const CONCLUSION_LABELS: Record<PdfLocale, string> = {
	"pt-BR": "Palavras de conclusão",
	es: "Palabras de conclusión",
	en: "Concluding comments",
};

export function mapProgramToPdfData(
	program: MeetingProgramDto,
	congregationName: string,
	locale: PdfLocale,
): WeekdayMeetingPdfData | null {
	if (program.isCancelled) {
		return null;
	}

	const parts = program.parts.filter((part) => !part.isDisabled);

	const chairman = parts.find((part) => part.kind === "MIDWEEK_CHAIRMAN");
	const openingSong = parts.find(
		(part) => part.kind === "MIDWEEK_OPENING_SONG",
	);
	const introduction = parts.find(
		(part) => part.kind === "MIDWEEK_INTRODUCTION",
	);
	const conclusion = parts.find((part) => part.kind === "MIDWEEK_CONCLUSION");
	const closingSongAndPrayer = parts.find(
		(part) => part.kind === "MIDWEEK_CLOSING_SONG_AND_PRAYER",
	);

	const openingItem: WeekdayMeetingPdfItem | undefined = openingSong
		? {
				id: openingSong.id,
				time: undefined,
				title: withDurationSuffix(
					buildSongTitle(openingSong, locale),
					openingSong.durationMin,
				),
				assignees: chairman
					? extractAssignees(chairman).map((assignee) => ({
							...assignee,
							role: "chairman" as const,
						}))
					: undefined,
				emphasis: "song",
				durationMin: openingSong.durationMin ?? undefined,
			}
		: undefined;

	const introductionItem: WeekdayMeetingPdfItem | undefined = introduction
		? {
				id: introduction.id,
				time: undefined,
				title: withDurationSuffix(
					cleanText(introduction.customTitle) ?? cleanText(introduction.title),
					introduction.durationMin,
				),
				assignees: undefined,
				emphasis: "opening",
				durationMin: introduction.durationMin ?? undefined,
			}
		: undefined;

	const conclusionItem: WeekdayMeetingPdfItem | undefined = conclusion
		? {
				id: conclusion.id,
				time: undefined,
				title: withDurationSuffix(
					cleanText(conclusion.customTitle) ??
						cleanText(conclusion.title) ??
						CONCLUSION_LABELS[locale],
					conclusion.durationMin,
				),
				assignees: extractAssignees(conclusion),
				emphasis: "conclusion",
				durationMin: conclusion.durationMin ?? undefined,
			}
		: undefined;

	const closingItem: WeekdayMeetingPdfItem | undefined = closingSongAndPrayer
		? {
				id: closingSongAndPrayer.id,
				time: undefined,
				title: withDurationSuffix(
					buildSongTitle(closingSongAndPrayer, locale),
					closingSongAndPrayer.durationMin,
				),
				assignees: extractAssignees(closingSongAndPrayer),
				emphasis: "song",
				durationMin: closingSongAndPrayer.durationMin ?? undefined,
			}
		: undefined;

	const sectionParts = parts.filter(
		(part) => !OPENING_KINDS.has(part.kind) && !CLOSING_KINDS.has(part.kind),
	);

	const sections = groupPartsIntoSections(sectionParts, locale);

	assignPartTimes(
		[
			openingItem,
			introductionItem,
			...sections.flatMap((section) => section.items),
			conclusionItem,
			closingItem,
		],
		program.scheduledTime,
	);

	return {
		id: program.id,
		date: cleanText(program.scheduledAt) ?? "",
		congregationName: cleanText(congregationName) ?? "",
		weekLabel: undefined,
		startTime: cleanText(program.scheduledTime),
		openingItem,
		introduction: introductionItem,
		sections,
		conclusion: conclusionItem,
		closingItem,
	};
}

export function mapWeekToPdfData(
	data: MeetingWeekDto,
	locale: PdfLocale,
): WeekdayMeetingPdfData | null {
	return mapProgramToPdfData(data.midweek, data.organizationName, locale);
}

export function mapWeeksToPdfData(
	weeks: MeetingWeekDto[],
	locale: PdfLocale,
): WeekdayMeetingPdfData[] {
	return weeks
		.map((week) => mapWeekToPdfData(week, locale))
		.filter((meeting): meeting is WeekdayMeetingPdfData => meeting !== null);
}
