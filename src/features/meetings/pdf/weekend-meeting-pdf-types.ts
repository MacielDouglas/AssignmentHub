import type { WeekdayMeetingPdfItem } from "./weekday-meeting-pdf-types";

export type WeekendMeetingPdfSectionKey = "publicTalk" | "watchtowerStudy";

export type WeekendMeetingPdfSection = {
	key: WeekendMeetingPdfSectionKey;
	subtitle?: string;
	items: WeekdayMeetingPdfItem[];
};

export type WeekendMeetingPdfData = {
	id: string;
	date: string;
	congregationName: string;
	weekLabel?: string;
	startTime?: string;
	openingItem?: WeekdayMeetingPdfItem;
	sections: WeekendMeetingPdfSection[];
	closingItem?: WeekdayMeetingPdfItem;
};
