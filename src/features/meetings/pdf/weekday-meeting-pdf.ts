import type { jsPDF } from "jspdf";
import {
	formatMeetingDate,
	getRoleLabel,
	getSectionLabel,
	type WeekdayMeetingPdfI18n,
	type WeekdayMeetingPdfLabels,
} from "./weekday-meeting-pdf-i18n";
import {
	getColumnMetrics,
	PDF_LAYOUT,
	type PdfPageLayout,
	planPages,
	splitPdfText,
} from "./weekday-meeting-pdf-layout";
import type {
	PdfLocale,
	WeekdayMeetingPdfAssignee,
	WeekdayMeetingPdfData,
	WeekdayMeetingPdfItem,
	WeekdayMeetingPdfSection,
	WeekdayMeetingPdfSectionKey,
} from "./weekday-meeting-pdf-types";

type Pdf = jsPDF;

const CONTROL_CHARACTERS = new RegExp(
	`[${String.fromCharCode(0)}-${String.fromCharCode(
		8,
	)}${String.fromCharCode(11)}${String.fromCharCode(
		12,
	)}${String.fromCharCode(14)}-${String.fromCharCode(31)}]`,
	"g",
);

const DATE_BAND_COLOR: [number, number, number] = [104, 119, 119];

const SECTION_STYLES: Record<
	WeekdayMeetingPdfSectionKey,
	{
		strong: [number, number, number];
		light: [number, number, number];
	}
> = {
	bibleTreasures: {
		strong: [101, 101, 106],
		light: [237, 237, 239],
	},
	applyYourself: {
		strong: [194, 145, 28],
		light: [251, 245, 230],
	},
	christianLife: {
		strong: [157, 34, 44],
		light: [249, 230, 233],
	},
};

function safeText(value: string | undefined | null): string {
	return (
		value?.replace(CONTROL_CHARACTERS, "").replace(/\s+/g, " ").trim() ?? ""
	);
}

function setTextColor(pdf: Pdf, color: [number, number, number]) {
	pdf.setTextColor(color[0], color[1], color[2]);
}

function setFillColor(pdf: Pdf, color: [number, number, number]) {
	pdf.setFillColor(color[0], color[1], color[2]);
}

function drawDiamondIcon(
	pdf: Pdf,
	centerX: number,
	centerY: number,
	size: number,
) {
	const half = size / 2;

	pdf.setDrawColor(255, 255, 255);
	pdf.setFillColor(255, 255, 255);
	pdf.setLineWidth(0.25);

	pdf.line(centerX, centerY - half, centerX + half, centerY);
	pdf.line(centerX + half, centerY, centerX, centerY + half);
	pdf.line(centerX, centerY + half, centerX - half, centerY);
	pdf.line(centerX - half, centerY, centerX, centerY - half);

	pdf.line(centerX - half, centerY, centerX + half, centerY);
	pdf.line(centerX - half / 2, centerY - half / 2, centerX, centerY);
	pdf.line(centerX + half / 2, centerY - half / 2, centerX, centerY);
	pdf.line(centerX - half / 2, centerY + half / 2, centerX, centerY);
	pdf.line(centerX + half / 2, centerY + half / 2, centerX, centerY);
}

function drawWheatIcon(
	pdf: Pdf,
	centerX: number,
	centerY: number,
	size: number,
) {
	const half = size / 2;
	const step = size / 4;

	pdf.setDrawColor(255, 255, 255);
	pdf.setLineWidth(0.35);

	pdf.line(centerX, centerY - half, centerX, centerY + half);

	pdf.line(
		centerX,
		centerY - half + step * 0.4,
		centerX - step,
		centerY - half + step,
	);
	pdf.line(
		centerX,
		centerY - half + step * 0.4,
		centerX + step,
		centerY - half + step,
	);

	pdf.line(
		centerX,
		centerY - half + step * 1.2,
		centerX - step,
		centerY - half + step * 1.8,
	);
	pdf.line(
		centerX,
		centerY - half + step * 1.2,
		centerX + step,
		centerY - half + step * 1.8,
	);

	pdf.line(
		centerX,
		centerY - half + step * 2,
		centerX - step * 0.85,
		centerY - half + step * 2.6,
	);
	pdf.line(
		centerX,
		centerY - half + step * 2,
		centerX + step * 0.85,
		centerY - half + step * 2.6,
	);
}

function drawHeartIcon(
	pdf: Pdf,
	centerX: number,
	centerY: number,
	size: number,
) {
	const radius = size * 0.18;
	const bottomY = centerY + size * 0.26;

	pdf.setFillColor(255, 255, 255);
	pdf.setDrawColor(255, 255, 255);
	pdf.setLineWidth(0.25);

	pdf.circle(centerX - radius, centerY - radius * 0.25, radius, "F");
	pdf.circle(centerX + radius, centerY - radius * 0.25, radius, "F");

	pdf.triangle(
		centerX - radius * 1.8,
		centerY,
		centerX + radius * 1.8,
		centerY,
		centerX,
		bottomY,
		"F",
	);
}

function drawSectionIcon(
	pdf: Pdf,
	key: WeekdayMeetingPdfSectionKey,
	centerX: number,
	centerY: number,
	size: number,
) {
	switch (key) {
		case "bibleTreasures":
			drawDiamondIcon(pdf, centerX, centerY, size);
			return;
		case "applyYourself":
			drawWheatIcon(pdf, centerX, centerY, size);
			return;
		case "christianLife":
			drawHeartIcon(pdf, centerX, centerY, size);
			return;
	}
}

function getAssigneeDisplayText(
	assignee: WeekdayMeetingPdfAssignee,
	labels: WeekdayMeetingPdfLabels,
): string {
	const name = safeText(assignee.name);

	if (!name) {
		return "";
	}

	const role = getRoleLabel(labels, assignee.role);

	if (!role) {
		return name;
	}

	return `${name} (${role})`;
}

function drawAssignees(
	pdf: Pdf,
	assignees: WeekdayMeetingPdfAssignee[] | undefined,
	labels: WeekdayMeetingPdfLabels,
	rightX: number,
	topY: number,
	width: number,
): void {
	if (!assignees?.length) {
		return;
	}

	let cursorY =
		topY + PDF_LAYOUT.rowPaddingTop + PDF_LAYOUT.assigneeLineHeight * 0.74;

	pdf.setFont("helvetica", "italic");
	pdf.setFontSize(PDF_LAYOUT.assigneeTextSize);
	pdf.setTextColor(45, 45, 45);

	for (const assignee of assignees) {
		const displayText = getAssigneeDisplayText(assignee, labels);

		if (!displayText) {
			continue;
		}

		const lines = splitPdfText(pdf, displayText, width);

		for (const line of lines) {
			pdf.text(line, rightX, cursorY, { align: "right" });
			cursorY += PDF_LAYOUT.assigneeLineHeight;
		}
	}
}

function drawTime(
	pdf: Pdf,
	time: string | undefined,
	x: number,
	topY: number,
	width: number,
): void {
	const value = safeText(time);

	if (!value) {
		return;
	}

	pdf.setFont("helvetica", "bold");
	pdf.setFontSize(PDF_LAYOUT.timeTextSize);
	pdf.setTextColor(38, 38, 38);
	pdf.text(value, x + width / 2, topY + PDF_LAYOUT.rowPaddingTop + 2.05, {
		align: "center",
	});
}

function drawProgramRow(
	pdf: Pdf,
	item: WeekdayMeetingPdfItem,
	labels: WeekdayMeetingPdfLabels,
	x: number,
	y: number,
	contentWidth: number,
): number {
	const columns = getColumnMetrics(contentWidth);
	const activityX =
		x + columns.timeColumnWidth + PDF_LAYOUT.activityLeftPadding;
	const contentRight = x + contentWidth;
	const assigneeRight = contentRight;
	const titleLines = splitPdfText(pdf, item.title, columns.activityWidth);
	const subtitleLines = splitPdfText(pdf, item.subtitle, columns.activityWidth);

	const lineCount = Math.max(titleLines.length, 1);
	const subtitleHeight = subtitleLines.length * PDF_LAYOUT.subtitleLineHeight;

	const assigneeLineCount = (item.assignees ?? []).reduce((count, assignee) => {
		const text = getAssigneeDisplayText(assignee, labels);
		return (
			count +
			Math.max(splitPdfText(pdf, text, columns.assigneeColumnWidth).length, 1)
		);
	}, 0);

	const titleHeight = lineCount * PDF_LAYOUT.lineHeight + subtitleHeight;
	const assigneeHeight =
		assigneeLineCount > 0
			? assigneeLineCount * PDF_LAYOUT.assigneeLineHeight
			: 0;

	const contentHeight = Math.max(
		titleHeight,
		assigneeHeight,
		item.emphasis === "song" ? PDF_LAYOUT.songRowMinHeight : 0,
	);

	const rowHeight = Math.max(
		contentHeight + PDF_LAYOUT.rowPaddingTop + PDF_LAYOUT.rowPaddingBottom,
		item.emphasis === "song"
			? PDF_LAYOUT.songRowMinHeight
			: PDF_LAYOUT.itemMinHeight,
	);

	if (item.time) {
		pdf.setFillColor(244, 246, 246);
		pdf.rect(x, y, columns.timeColumnWidth, rowHeight, "F");
	}

	drawTime(pdf, item.time, x, y, columns.timeColumnWidth);

	const isSong = item.emphasis === "song";
	const isConclusion = item.emphasis === "conclusion";

	pdf.setFont(
		"helvetica",
		isSong
			? "italic"
			: isConclusion || item.emphasis === "opening"
				? "bold"
				: "bold",
	);
	pdf.setFontSize(PDF_LAYOUT.bodyTextSize);
	pdf.setTextColor(30, 30, 30);

	let textY = y + PDF_LAYOUT.rowPaddingTop + 2.1;

	for (const line of titleLines.length > 0 ? titleLines : [""]) {
		pdf.text(line, activityX, textY);
		textY += PDF_LAYOUT.lineHeight;
	}

	if (subtitleLines.length > 0) {
		pdf.setFont("helvetica", "normal");
		pdf.setFontSize(PDF_LAYOUT.bodyTextSmallSize);
		pdf.setTextColor(85, 85, 85);

		for (const line of subtitleLines) {
			pdf.text(line, activityX, textY);
			textY += PDF_LAYOUT.subtitleLineHeight;
		}
	}

	drawAssignees(
		pdf,
		item.assignees,
		labels,
		assigneeRight,
		y,
		columns.assigneeColumnWidth,
	);

	return y + rowHeight;
}

function drawSectionBand(
	pdf: Pdf,
	section: WeekdayMeetingPdfSection,
	labels: WeekdayMeetingPdfLabels,
	x: number,
	y: number,
	width: number,
): number {
	const style = SECTION_STYLES[section.key];
	const title = getSectionLabel(labels, section.key);
	const subtitle = safeText(section.subtitle);
	const iconWidth = PDF_LAYOUT.sectionIconWidth;
	const height = PDF_LAYOUT.sectionBandHeight;

	setFillColor(pdf, style.strong);
	pdf.rect(x, y, iconWidth, height, "F");

	setFillColor(pdf, style.light);
	pdf.rect(x + iconWidth, y, width - iconWidth, height, "F");

	drawSectionIcon(
		pdf,
		section.key,
		x + iconWidth / 2,
		y + height / 2,
		iconWidth * 0.52,
	);

	const textX = x + iconWidth + 2.3;
	const textY = y + height / 2 + 1.1;

	pdf.setFont("helvetica", "bold");
	pdf.setFontSize(PDF_LAYOUT.sectionTitleSize);
	setTextColor(pdf, style.strong);

	const subtitleText = subtitle ? ` (${subtitle})` : "";
	const completeTitle = `${title}${subtitleText}`;

	const availableWidth = width - iconWidth - 4;

	if (pdf.getTextWidth(completeTitle) <= availableWidth) {
		pdf.text(completeTitle, textX, textY);
	} else {
		pdf.text(title, textX, y + 3.15);

		if (subtitle) {
			pdf.setFont("helvetica", "normal");
			pdf.setFontSize(PDF_LAYOUT.bodyTextSmallSize);
			setTextColor(pdf, [75, 75, 75]);

			const subtitleLines = splitPdfText(pdf, subtitle, availableWidth);

			if (subtitleLines[0]) {
				pdf.text(subtitleLines[0], textX, y + 5.95);
			}
		}
	}

	return y + height + PDF_LAYOUT.sectionGapAfter;
}

function drawDateBand(
	pdf: Pdf,
	weekLabel: string | undefined,
	dateText: string,
	x: number,
	y: number,
	width: number,
): number {
	const height = PDF_LAYOUT.dateBandHeight;
	const weekCellWidth = PDF_LAYOUT.timeColumnWidth;

	setFillColor(pdf, DATE_BAND_COLOR);
	pdf.rect(x, y, width, height, "F");

	pdf.setFont("helvetica", "bold");
	pdf.setFontSize(PDF_LAYOUT.dateBandWeekSize);
	pdf.setTextColor(255, 255, 255);

	const week = safeText(weekLabel);

	if (week) {
		pdf.text(week, x + weekCellWidth / 2, y + height / 2 + 1.1, {
			align: "center",
		});
	}

	pdf.setDrawColor(220, 225, 225);
	pdf.setLineWidth(0.15);
	pdf.line(x + weekCellWidth, y + 1.25, x + weekCellWidth, y + height - 1.25);

	pdf.setFont("helvetica", "bold");
	pdf.setFontSize(PDF_LAYOUT.dateBandTextSize);
	pdf.setTextColor(255, 255, 255);
	pdf.text(dateText, x + weekCellWidth + 3, y + height / 2 + 1.05);

	return y + height + PDF_LAYOUT.dateBandGapAfter;
}

function drawHeader(
	pdf: Pdf,
	meeting: WeekdayMeetingPdfData,
	labels: WeekdayMeetingPdfLabels,
	locale: PdfLocale,
	x: number,
	y: number,
	width: number,
): number {
	const centerX = x + width / 2;

	pdf.setFont("helvetica", "normal");
	pdf.setFontSize(PDF_LAYOUT.congregationSize);
	pdf.setTextColor(25, 25, 25);
	pdf.text(safeText(meeting.congregationName), centerX, y + 5.1, {
		align: "center",
	});

	pdf.setDrawColor(190, 190, 190);
	pdf.setLineWidth(0.2);
	pdf.line(x + 10, y + 6.7, x + width - 10, y + 6.7);

	pdf.setFont("helvetica", "bold");
	pdf.setFontSize(PDF_LAYOUT.headerTitleSize);
	pdf.setTextColor(20, 20, 20);
	pdf.text(labels.documentTitle, centerX, y + 10.25, {
		align: "center",
	});

	const dateBandY = y + 13;

	return drawDateBand(
		pdf,
		meeting.weekLabel,
		formatMeetingDate(meeting.date, locale),
		x,
		dateBandY,
		width,
	);
}

function drawMeetingBlock(
	pdf: Pdf,
	meeting: WeekdayMeetingPdfData,
	labels: WeekdayMeetingPdfLabels,
	locale: PdfLocale,
	x: number,
	y: number,
	width: number,
): void {
	let cursorY = drawHeader(pdf, meeting, labels, locale, x, y, width);

	if (meeting.openingItem) {
		cursorY = drawProgramRow(
			pdf,
			meeting.openingItem,
			labels,
			x,
			cursorY,
			width,
		);
	}

	if (meeting.introduction) {
		cursorY = drawProgramRow(
			pdf,
			{
				...meeting.introduction,
				title: safeText(meeting.introduction.title) || labels.openingComments,
				emphasis: "opening",
			},
			labels,
			x,
			cursorY,
			width,
		);
	}

	for (const section of meeting.sections) {
		cursorY = drawSectionBand(pdf, section, labels, x, cursorY, width);

		for (const item of section.items) {
			cursorY = drawProgramRow(pdf, item, labels, x, cursorY, width);
		}
	}

	if (meeting.conclusion) {
		cursorY = drawProgramRow(
			pdf,
			{
				...meeting.conclusion,
				title: safeText(meeting.conclusion.title) || labels.concludingComments,
				emphasis: "conclusion",
			},
			labels,
			x,
			cursorY,
			width,
		);
	}

	if (meeting.closingItem) {
		drawProgramRow(pdf, meeting.closingItem, labels, x, cursorY, width);
	}
}

function drawFullPageMeeting(
	pdf: Pdf,
	meeting: WeekdayMeetingPdfData,
	labels: WeekdayMeetingPdfLabels,
	locale: PdfLocale,
): void {
	drawMeetingBlock(
		pdf,
		meeting,
		labels,
		locale,
		PDF_LAYOUT.marginX,
		PDF_LAYOUT.marginTop,
		PDF_LAYOUT.contentWidth,
	);
}

function drawPage(
	pdf: Pdf,
	page: PdfPageLayout,
	labels: WeekdayMeetingPdfLabels,
	locale: PdfLocale,
): void {
	if (page.fullMeeting) {
		drawFullPageMeeting(pdf, page.fullMeeting, labels, locale);
		return;
	}

	const topBlockY = PDF_LAYOUT.marginTop;
	const bottomBlockY =
		PDF_LAYOUT.marginTop + PDF_LAYOUT.blockHeight + PDF_LAYOUT.blockGap;
	const separatorY =
		PDF_LAYOUT.marginTop + PDF_LAYOUT.blockHeight + PDF_LAYOUT.blockGap / 2;

	if (page.topMeeting) {
		drawMeetingBlock(
			pdf,
			page.topMeeting,
			labels,
			locale,
			PDF_LAYOUT.marginX,
			topBlockY,
			PDF_LAYOUT.contentWidth,
		);
	}

	if (page.bottomMeeting) {
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
		);
	}
}

function buildFileName(
	meetings: WeekdayMeetingPdfData[],
	singlePrefix: string,
	pluralPrefix: string,
): string {
	const sorted = [...meetings].sort((first, second) =>
		first.date.localeCompare(second.date),
	);

	const firstDate = sorted[0]?.date ?? "sem-data";
	const lastDate = sorted.at(-1)?.date ?? "sem-data";
	const prefix = sorted.length === 1 ? singlePrefix : pluralPrefix;

	if (sorted.length === 1) {
		return `${prefix}-${firstDate}.pdf`;
	}

	return `${prefix}-${firstDate}-a-${lastDate}.pdf`;
}

export function generateWeekdayMeetingPdf(
	meetings: WeekdayMeetingPdfData[],
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

	const pages = planPages(sortedMeetings, PDF_LAYOUT.contentWidth, pdf);

	pages.forEach((page, index) => {
		if (index > 0) {
			pdf.addPage();
		}

		drawPage(pdf, page, i18n.labels, i18n.locale);
	});

	const fileName = buildFileName(
		sortedMeetings,
		i18n.filePrefixSingle,
		i18n.filePrefixPlural,
	);

	pdf.save(fileName);
}
