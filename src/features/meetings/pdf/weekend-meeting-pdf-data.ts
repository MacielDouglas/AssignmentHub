import type {
	MeetingProgramDto,
	MeetingWeekDto,
} from "../domain/meeting-types";
import {
	assignPartTimes,
	buildSongTitle,
	cleanText,
	extractAssignees,
	withDurationSuffix,
} from "./weekday-meeting-pdf-data";
import type { PdfLocale } from "./weekday-meeting-pdf-types";
import type {
	WeekendMeetingPdfData,
	WeekendMeetingPdfSection,
} from "./weekend-meeting-pdf-types";

function mapTalkItem(part: MeetingProgramDto["parts"][number]) {
	return {
		id: part.id,
		time: undefined,
		title: withDurationSuffix(
			cleanText(part.customTitle) ?? cleanText(part.title),
			part.durationMin,
		),
		subtitle: undefined,
		assignees: extractAssignees(part),
		emphasis: "normal" as const,
		durationMin: part.durationMin ?? undefined,
	};
}

export function mapWeekendProgramToPdfData(
	program: MeetingProgramDto,
	congregationName: string,
	locale: PdfLocale,
): WeekendMeetingPdfData | null {
	if (program.isCancelled) {
		return null;
	}

	const parts = program.parts.filter((part) => !part.isDisabled);

	const chairman = parts.find((part) => part.kind === "WEEKEND_CHAIRMAN");
	const openingSong = parts.find(
		(part) => part.kind === "WEEKEND_OPENING_SONG",
	);
	const publicTalk = parts.find((part) => part.kind === "WEEKEND_PUBLIC_TALK");
	const circuitFinalTalk = parts.find(
		(part) => part.kind === "WEEKEND_CIRCUIT_OVERSEER_FINAL_TALK",
	);
	const study = parts.find((part) => part.kind === "WEEKEND_WATCHTOWER_STUDY");
	const closingSongAndPrayer = parts.find(
		(part) => part.kind === "WEEKEND_CLOSING_SONG_AND_PRAYER",
	);

	const openingItem = openingSong
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
				emphasis: "song" as const,
				durationMin: openingSong.durationMin ?? undefined,
			}
		: undefined;

	const talkItems = [publicTalk, circuitFinalTalk]
		.filter((part) => part !== undefined)
		.map((part) => mapTalkItem(part));

	const studyItem = study
		? {
				id: study.id,
				time: undefined,
				title: withDurationSuffix(
					cleanText(study.customTitle) ?? cleanText(study.title),
					study.durationMin,
				),
				subtitle: cleanText(study.theme),
				assignees: extractAssignees(study),
				emphasis: "study" as const,
				durationMin: study.durationMin ?? undefined,
			}
		: undefined;

	const sections: WeekendMeetingPdfSection[] = [];

	if (talkItems.length > 0) {
		sections.push({ key: "publicTalk", items: talkItems });
	}

	if (studyItem) {
		sections.push({ key: "watchtowerStudy", items: [studyItem] });
	}

	const closingItem = closingSongAndPrayer
		? {
				id: closingSongAndPrayer.id,
				time: undefined,
				title: withDurationSuffix(
					buildSongTitle(closingSongAndPrayer, locale),
					closingSongAndPrayer.durationMin,
				),
				assignees: extractAssignees(closingSongAndPrayer),
				emphasis: "song" as const,
				durationMin: closingSongAndPrayer.durationMin ?? undefined,
			}
		: undefined;

	assignPartTimes(
		[openingItem, ...sections.flatMap((section) => section.items), closingItem],
		program.scheduledTime,
	);

	return {
		id: program.id,
		date: cleanText(program.scheduledAt) ?? "",
		congregationName: cleanText(congregationName) ?? "",
		weekLabel: undefined,
		startTime: cleanText(program.scheduledTime),
		openingItem,
		sections,
		closingItem,
	};
}

export function mapWeekToWeekendPdfData(
	data: MeetingWeekDto,
	locale: PdfLocale,
): WeekendMeetingPdfData | null {
	return mapWeekendProgramToPdfData(
		data.weekend,
		data.organizationName,
		locale,
	);
}

export function mapWeeksToWeekendPdfData(
	weeks: MeetingWeekDto[],
	locale: PdfLocale,
): WeekendMeetingPdfData[] {
	return weeks
		.map((week) => mapWeekToWeekendPdfData(week, locale))
		.filter((meeting): meeting is WeekendMeetingPdfData => meeting !== null);
}
