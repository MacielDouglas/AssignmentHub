import type {
	WeekdayMeetingPdfAssignee,
	WeekdayMeetingPdfData,
	WeekdayMeetingPdfItem,
	WeekdayMeetingPdfSection,
} from "./weekday-meeting-pdf-types";

export const PDF_LAYOUT = {
	pageWidth: 210,
	pageHeight: 297,

	marginX: 13,
	marginTop: 8,
	marginBottom: 8,

	contentWidth: 184,

	pageHeaderHeight: 14.5,
	pageHeaderGap: 1.5,

	blockHeight: 128,
	blockGap: 8,

	congregationSize: 12,
	headerTitleSize: 7.2,
	subtitleSize: 6.6,

	dateBandTextSize: 8.5,
	dateBandWeekSize: 9.6,

	sectionTitleSize: 8.5,
	bodyTextSize: 7.2,
	bodyTextSmallSize: 6.2,
	assigneeTextSize: 6.5,
	timeTextSize: 6.2,

	headerCongregationHeight: 6,
	headerRuleOffset: 1.5,
	headerRuleHeight: 0.5,
	headerTitleHeight: 4.7,

	dateBandHeight: 9,
	sectionBandHeight: 8,

	lineHeight: 3.3,
	subtitleLineHeight: 2.9,
	assigneeLineHeight: 3.2,

	openingRowHeight: 5.45,
	itemMinHeight: 5.45,
	songRowMinHeight: 4.8,

	timeColumnWidth: 11.5,
	sectionIconWidth: 11.5,
	activityLeftPadding: 2.2,
	assigneeColumnWidth: 47,

	rowPaddingTop: 1.1,
	rowPaddingBottom: 1.05,
	sectionGapAfter: 0.55,
	dateBandGapAfter: 0.55,
	headerGapBeforeDateBand: 1.5,

	fullPageContentHeight: 281,
} as const;

export type Splitter = {
	splitTextToSize: (text: string, maxWidth: number) => string[];
};

export type PdfPageLayout = {
	topMeeting: WeekdayMeetingPdfData | null;
	bottomMeeting: WeekdayMeetingPdfData | null;
};

function normalizeText(value: string | undefined): string {
	return value?.replace(/\s+/g, " ").trim() ?? "";
}

export function splitPdfText(
	doc: Splitter,
	value: string | undefined,
	width: number,
): string[] {
	const text = normalizeText(value);

	if (!text) {
		return [];
	}

	return doc.splitTextToSize(text, width).filter(Boolean);
}

export function getColumnMetrics(contentWidth: number) {
	const timeColumnWidth = PDF_LAYOUT.timeColumnWidth;
	const assigneeColumnWidth = PDF_LAYOUT.assigneeColumnWidth;
	const activityLeftPadding = PDF_LAYOUT.activityLeftPadding;

	const activityWidth =
		contentWidth -
		timeColumnWidth -
		assigneeColumnWidth -
		activityLeftPadding -
		2;

	return {
		timeColumnWidth,
		assigneeColumnWidth,
		activityLeftPadding,
		activityWidth: Math.max(activityWidth, 40),
	};
}

function getAssigneeLineCount(
	doc: Splitter,
	assignees: WeekdayMeetingPdfAssignee[] | undefined,
	assigneeWidth: number,
): number {
	if (!assignees?.length) {
		return 0;
	}

	return assignees.reduce((total, assignee) => {
		const name = normalizeText(assignee.name);

		if (!name) {
			return total;
		}

		return total + Math.max(splitPdfText(doc, name, assigneeWidth).length, 1);
	}, 0);
}

export function measureProgramRow(
	doc: Splitter,
	item: WeekdayMeetingPdfItem,
	contentWidth: number,
): number {
	const columns = getColumnMetrics(contentWidth);

	const titleLines = splitPdfText(doc, item.title, columns.activityWidth);
	const subtitleLines = splitPdfText(doc, item.subtitle, columns.activityWidth);

	const titleHeight = Math.max(titleLines.length, 1) * PDF_LAYOUT.lineHeight;
	const subtitleHeight = subtitleLines.length * PDF_LAYOUT.subtitleLineHeight;

	const assigneeLineCount = getAssigneeLineCount(
		doc,
		item.assignees,
		columns.assigneeColumnWidth,
	);

	const assigneeHeight =
		assigneeLineCount > 0
			? assigneeLineCount * PDF_LAYOUT.assigneeLineHeight
			: 0;

	const contentHeight = Math.max(
		titleHeight + subtitleHeight,
		assigneeHeight,
		item.emphasis === "song" ? PDF_LAYOUT.songRowMinHeight : 0,
	);

	return Math.max(
		contentHeight + PDF_LAYOUT.rowPaddingTop + PDF_LAYOUT.rowPaddingBottom,
		item.emphasis === "song"
			? PDF_LAYOUT.songRowMinHeight
			: PDF_LAYOUT.itemMinHeight,
	);
}

export function measureSectionBand(): number {
	return PDF_LAYOUT.sectionBandHeight + PDF_LAYOUT.sectionGapAfter;
}

export function measureSectionBlock(
	doc: Splitter,
	section: WeekdayMeetingPdfSection,
	contentWidth: number,
): number {
	let height = measureSectionBand();

	for (const item of section.items) {
		height += measureProgramRow(doc, item, contentWidth);
	}

	return height;
}

export function measureOpeningBlock(
	doc: Splitter,
	openingItem: WeekdayMeetingPdfItem | undefined,
	introduction: WeekdayMeetingPdfItem | undefined,
	contentWidth: number,
): number {
	let height = 0;

	if (openingItem) {
		height += measureProgramRow(doc, openingItem, contentWidth);
	}

	if (introduction) {
		height += measureProgramRow(doc, introduction, contentWidth);
	}

	return height;
}

export function measureClosingBlock(
	doc: Splitter,
	conclusion: WeekdayMeetingPdfItem | undefined,
	closingItem: WeekdayMeetingPdfItem | undefined,
	contentWidth: number,
): number {
	let height = 0;

	if (conclusion) {
		height += measureProgramRow(doc, conclusion, contentWidth);
	}

	if (closingItem) {
		height += measureProgramRow(doc, closingItem, contentWidth);
	}

	return height;
}

export function estimateMeetingBlockHeight(
	meeting: WeekdayMeetingPdfData,
	contentWidth: number,
	doc: Splitter,
): number {
	let height = 0;

	height += PDF_LAYOUT.headerCongregationHeight;
	height += PDF_LAYOUT.headerRuleOffset;
	height += PDF_LAYOUT.headerRuleHeight;
	height += PDF_LAYOUT.headerTitleHeight;
	height += PDF_LAYOUT.headerGapBeforeDateBand;

	height += PDF_LAYOUT.dateBandHeight + PDF_LAYOUT.dateBandGapAfter;

	height += measureOpeningBlock(
		doc,
		meeting.openingItem,
		meeting.introduction,
		contentWidth,
	);

	for (const section of meeting.sections) {
		height += measureSectionBlock(doc, section, contentWidth);
	}

	height += measureClosingBlock(
		doc,
		meeting.conclusion,
		meeting.closingItem,
		contentWidth,
	);

	return height;
}

export function planPages(meetings: WeekdayMeetingPdfData[]): PdfPageLayout[] {
	const pages: PdfPageLayout[] = [];

	for (let index = 0; index < meetings.length; index += 2) {
		pages.push({
			topMeeting: meetings[index] ?? null,
			bottomMeeting: meetings[index + 1] ?? null,
		});
	}

	return pages;
}
