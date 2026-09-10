import type { jsPDF } from "jspdf";
import {
	buildFileName,
	drawDateBand,
	drawPageHeader,
	drawProgramRow,
	drawSectionWithBackground,
	fitPageLayout,
	measureRowHeight,
	type TitledBandInput,
} from "./weekday-meeting-pdf";
import {
	formatMeetingDate,
	getWeekendSectionLabel,
	type WeekdayMeetingPdfI18n,
	type WeekdayMeetingPdfLabels,
} from "./weekday-meeting-pdf-i18n";
import {
	PDF_LAYOUT,
	type PdfLayout,
	type PdfPageLayout,
	planPages,
} from "./weekday-meeting-pdf-layout";
import type { PdfLocale } from "./weekday-meeting-pdf-types";
import type {
	WeekendMeetingPdfData,
	WeekendMeetingPdfSection,
} from "./weekend-meeting-pdf-types";

type Pdf = jsPDF;

const WEEKEND_SECTION_STYLES: Record<
	WeekendMeetingPdfSection["key"],
	{
		strong: [number, number, number];
		light: [number, number, number];
	}
> = {
	publicTalk: {
		strong: [47, 72, 112],
		light: [234, 237, 241],
	},
	watchtowerStudy: {
		strong: [77, 101, 77],
		light: [237, 240, 237],
	},
};

function toTitledBandInput(
	section: WeekendMeetingPdfSection,
	labels: WeekdayMeetingPdfLabels,
): TitledBandInput {
	const style = WEEKEND_SECTION_STYLES[section.key];

	return {
		title: getWeekendSectionLabel(labels, section.key),
		icon: section.key,
		strong: style.strong,
		light: style.light,
	};
}

export function measureWeekendBlock(
	pdf: Pdf,
	meeting: WeekendMeetingPdfData,
	labels: WeekdayMeetingPdfLabels,
	contentWidth: number,
	layout: PdfLayout = PDF_LAYOUT,
): number {
	let height = layout.dateBandHeight + layout.dateBandGapAfter;

	const hasClosing = !!meeting.closingItem;
	const lastSectionIndex = meeting.sections.length - 1;

	if (meeting.openingItem) {
		height += measureRowHeight(
			pdf,
			meeting.openingItem,
			labels,
			contentWidth,
			!hasClosing && meeting.sections.length === 0,
			layout,
		);
	}

	meeting.sections.forEach((section, sectionIndex) => {
		height += layout.sectionBandHeight + layout.sectionGapAfter;

		const isFinalSection = sectionIndex === lastSectionIndex && !hasClosing;

		section.items.forEach((item, itemIndex) => {
			height += measureRowHeight(
				pdf,
				item,
				labels,
				contentWidth,
				isFinalSection && itemIndex === section.items.length - 1,
				layout,
			);
		});
	});

	if (meeting.closingItem) {
		height += measureRowHeight(
			pdf,
			meeting.closingItem,
			labels,
			contentWidth,
			true,
			layout,
		);
	}

	return height;
}

function drawMeetingBlock(
	pdf: Pdf,
	meeting: WeekendMeetingPdfData,
	labels: WeekdayMeetingPdfLabels,
	locale: PdfLocale,
	x: number,
	y: number,
	width: number,
	layout: PdfLayout = PDF_LAYOUT,
): number {
	const hasClosing = !!meeting.closingItem;
	const lastSectionIndex = meeting.sections.length - 1;

	let cursorY = drawDateBand(
		pdf,
		formatMeetingDate(meeting.date, locale),
		x,
		y,
		width,
		layout,
	);

	if (meeting.openingItem) {
		const isLast = !hasClosing && meeting.sections.length === 0;

		cursorY = drawProgramRow(
			pdf,
			meeting.openingItem,
			labels,
			x,
			cursorY,
			width,
			isLast,
			layout,
		);
	}

	meeting.sections.forEach((section, sectionIndex) => {
		cursorY = drawSectionWithBackground(
			pdf,
			toTitledBandInput(section, labels),
			section.items,
			labels,
			x,
			cursorY,
			width,
			sectionIndex === lastSectionIndex && !hasClosing
				? section.items.length - 1
				: null,
			layout,
		);
	});

	if (meeting.closingItem) {
		cursorY = drawProgramRow(
			pdf,
			meeting.closingItem,
			labels,
			x,
			cursorY,
			width,
			true,
			layout,
		);
	}

	return cursorY;
}

function drawPage(
	pdf: Pdf,
	page: PdfPageLayout<WeekendMeetingPdfData>,
	labels: WeekdayMeetingPdfLabels,
	locale: PdfLocale,
	layout: PdfLayout = PDF_LAYOUT,
): void {
	const headerMeeting = page.topMeeting ?? page.bottomMeeting;

	let topBlockY = PDF_LAYOUT.marginTop;

	if (headerMeeting) {
		drawPageHeader(
			pdf,
			headerMeeting,
			labels.weekendDocumentTitle,
			PDF_LAYOUT.marginX,
			topBlockY,
			PDF_LAYOUT.contentWidth,
		);
		topBlockY += PDF_LAYOUT.pageHeaderHeight + PDF_LAYOUT.pageHeaderGap;
	}

	const bottomBlockY = topBlockY + PDF_LAYOUT.blockHeight + PDF_LAYOUT.blockGap;
	const fixedSeparatorY =
		topBlockY + PDF_LAYOUT.blockHeight + PDF_LAYOUT.blockGap / 2;

	let topEndY = topBlockY;

	if (page.topMeeting) {
		topEndY = drawMeetingBlock(
			pdf,
			page.topMeeting,
			labels,
			locale,
			PDF_LAYOUT.marginX,
			topBlockY,
			PDF_LAYOUT.contentWidth,
			layout,
		);
	}

	if (page.bottomMeeting) {
		const separatorY = page.topMeeting
			? Math.min(topEndY + 2, fixedSeparatorY)
			: fixedSeparatorY;

		pdf.setDrawColor(190, 190, 190);
		pdf.setLineWidth(0.2);
		pdf.line(
			PDF_LAYOUT.marginX,
			separatorY,
			PDF_LAYOUT.pageWidth - PDF_LAYOUT.marginX,
			separatorY,
		);

		drawMeetingBlock(
			pdf,
			page.bottomMeeting,
			labels,
			locale,
			PDF_LAYOUT.marginX,
			bottomBlockY,
			PDF_LAYOUT.contentWidth,
			layout,
		);
	}
}

export function generateWeekendMeetingPdf(
	meetings: WeekendMeetingPdfData[],
	i18n: WeekdayMeetingPdfI18n,
	createPdf: () => Pdf,
): void {
	if (meetings.length === 0) {
		return;
	}

	const pdf = createPdf();

	const sortedMeetings = [...meetings].sort((first, second) =>
		first.date.localeCompare(second.date),
	);

	const pages = planPages(sortedMeetings);

	pages.forEach((page, index) => {
		if (index > 0) {
			pdf.addPage();
		}

		const present = [page.topMeeting, page.bottomMeeting].filter(
			(meeting): meeting is WeekendMeetingPdfData => meeting !== null,
		);

		const layout = fitPageLayout(
			present.map(
				(meeting) => (candidate: PdfLayout) =>
					measureWeekendBlock(
						pdf,
						meeting,
						i18n.labels,
						PDF_LAYOUT.contentWidth,
						candidate,
					),
			),
			PDF_LAYOUT.blockHeight,
		);

		drawPage(pdf, page, i18n.labels, i18n.locale, layout);
	});

	const fileName = buildFileName(
		sortedMeetings,
		i18n.filePrefixWeekendSingle,
		i18n.filePrefixWeekendPlural,
	);

	pdf.save(fileName);
}
