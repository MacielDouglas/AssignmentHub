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

	blockHeight: 136.5,
	blockGap: 8,

	congregationSize: 10.4,
	headerTitleSize: 6.2,
	subtitleSize: 5.7,

	dateBandTextSize: 7.2,
	dateBandWeekSize: 8.4,

	sectionTitleSize: 7.2,
	bodyTextSize: 6.15,
	bodyTextSmallSize: 5.35,
	assigneeTextSize: 5.6,
	timeTextSize: 5.35,

	headerCongregationHeight: 5.4,
	headerRuleOffset: 1.4,
	headerRuleHeight: 0.5,
	headerTitleHeight: 4.2,

	dateBandHeight: 8.6,
	sectionBandHeight: 7.6,

	lineHeight: 2.8,
	subtitleLineHeight: 2.45,
	assigneeLineHeight: 2.75,

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
	headerGapBeforeDateBand: 0.6,

	fullPageContentHeight: 281,
} as const;

export type Splitter = {
	splitTextToSize: (text: string, maxWidth: number) => string[];
};

export type MeetingBlockPlacement = "half" | "full";

export type PdfPageLayout = {
	topMeeting: WeekdayMeetingPdfData | null;
	bottomMeeting: WeekdayMeetingPdfData | null;
	fullMeeting: WeekdayMeetingPdfData | null;
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

export function getMeetingPlacement(
	meeting: WeekdayMeetingPdfData,
	contentWidth: number,
	doc: Splitter,
): MeetingBlockPlacement {
	const height = estimateMeetingBlockHeight(meeting, contentWidth, doc);

	return height <= PDF_LAYOUT.blockHeight ? "half" : "full";
}

export function planPages(
	meetings: WeekdayMeetingPdfData[],
	contentWidth: number,
	doc: Splitter,
): PdfPageLayout[] {
	const pages: PdfPageLayout[] = [];
	let waitingTopMeeting: WeekdayMeetingPdfData | null = null;

	for (const meeting of meetings) {
		const placement = getMeetingPlacement(meeting, contentWidth, doc);

		if (placement === "full") {
			if (waitingTopMeeting) {
				pages.push({
					topMeeting: waitingTopMeeting,
					bottomMeeting: null,
					fullMeeting: null,
				});

				waitingTopMeeting = null;
			}

			pages.push({
				topMeeting: null,
				bottomMeeting: null,
				fullMeeting: meeting,
			});

			continue;
		}

		if (!waitingTopMeeting) {
			waitingTopMeeting = meeting;
			continue;
		}

		pages.push({
			topMeeting: waitingTopMeeting,
			bottomMeeting: meeting,
			fullMeeting: null,
		});

		waitingTopMeeting = null;
	}

	if (waitingTopMeeting) {
		pages.push({
			topMeeting: waitingTopMeeting,
			bottomMeeting: null,
			fullMeeting: null,
		});
	}

	return pages;
}
