export type PdfLocale = "pt-BR" | "es" | "en";

export type WeekdayMeetingPdfAssigneeRole =
	| "chairman"
	| "conductor"
	| "reader"
	| "assistant"
	| "prayer"
	| "other";

export type WeekdayMeetingPdfAssignee = {
	name: string;
	role?: WeekdayMeetingPdfAssigneeRole;
};

export type WeekdayMeetingPdfItemEmphasis =
	| "normal"
	| "song"
	| "opening"
	| "conclusion"
	| "study";

export type WeekdayMeetingPdfItem = {
	id: string;
	time?: string;
	title?: string;
	subtitle?: string;
	assignees?: WeekdayMeetingPdfAssignee[];
	emphasis?: WeekdayMeetingPdfItemEmphasis;
	durationMin?: number;
	compactAfter?: boolean;
	gapAfterMin?: number;
};

export type WeekdayMeetingPdfSectionKey =
	| "bibleTreasures"
	| "applyYourself"
	| "christianLife";

export type WeekdayMeetingPdfSection = {
	key: WeekdayMeetingPdfSectionKey;
	title?: string;
	subtitle?: string;
	items: WeekdayMeetingPdfItem[];
};

export type WeekdayMeetingPdfData = {
	id: string;
	date: string;
	congregationName: string;
	weekLabel?: string;
	startTime?: string;
	openingItem?: WeekdayMeetingPdfItem;
	introduction?: WeekdayMeetingPdfItem;
	sections: WeekdayMeetingPdfSection[];
	conclusion?: WeekdayMeetingPdfItem;
	closingItem?: WeekdayMeetingPdfItem;
};
