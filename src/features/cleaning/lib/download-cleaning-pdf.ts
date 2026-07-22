"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { CleaningPdfInput } from "@/features/cleaning/lib/cleaning-pdf-types";

const CONTROL_CHARS_RE = new RegExp(
	`[${String.fromCharCode(0)}-${String.fromCharCode(8)}${String.fromCharCode(11)}${String.fromCharCode(12)}${String.fromCharCode(14)}-${String.fromCharCode(31)}]`,
	"g",
);

function safeText(value: unknown, fallback = ""): string {
	if (value === null || value === undefined) return fallback;
	const s = String(value).replace(CONTROL_CHARS_RE, "").trim();
	return s || fallback;
}

function formatDateLabel(
	iso: string,
	weekdays: readonly string[],
	emptyCell: string,
): string {
	const raw = safeText(iso, "");
	const parts = raw.split("-").map(Number);
	if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) {
		return raw || emptyCell;
	}
	const [y, m, d] = parts;
	const dt = new Date(y, m - 1, d);
	if (Number.isNaN(dt.getTime())) return raw;
	const dd = String(d).padStart(2, "0");
	const mm = String(m).padStart(2, "0");
	const wd = weekdays[dt.getDay()] ?? "";
	return `${dd}/${mm}/${y} ${wd}`.trim();
}

function cellNames(names: string[] | undefined, emptyCell: string): string {
	if (!names || names.length === 0) return emptyCell;
	return names.map((n) => safeText(n, emptyCell)).join(" - ");
}

type JsPdfWithAutoTable = jsPDF & {
	lastAutoTable?: { finalY: number };
};

export function downloadCleaningPdf(input: CleaningPdfInput): void {
	const i18n = input.i18n;
	const organizationName = safeText(input.organizationName, i18n.orgFallback);
	const title = safeText(input.title, i18n.titleDefault);

	const sectors = [...(input.sectors ?? [])]
		.filter((s) => s?.id)
		.sort(
			(a, b) =>
				(a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
				(a.name ?? "").localeCompare(b.name ?? ""),
		)
		.map((s) => ({
			id: s.id,
			name: safeText(s.name, i18n.sectorFallback),
			description: s.description ?? null,
			sortOrder: s.sortOrder ?? 0,
		}));

	const days = input.days ?? [];

	if (sectors.length === 0) {
		throw new Error(i18n.errNoSectors);
	}
	if (days.length === 0) {
		throw new Error(i18n.errNoDays);
	}

	const doc = new jsPDF({
		orientation: "portrait",
		unit: "mm",
		format: "a4",
	}) as JsPdfWithAutoTable;

	const pageW = doc.internal.pageSize.getWidth();
	const pageH = doc.internal.pageSize.getHeight();
	const marginX = 8;
	const marginBottom = 14;
	let y = 12;

	doc.setFont("helvetica", "bold");
	doc.setFontSize(13);
	doc.text(organizationName, pageW / 2, y, { align: "center" });
	y += 6;
	doc.setFontSize(14);
	doc.text(title, pageW / 2, y, { align: "center" });
	y += 5;
	doc.setFont("helvetica", "normal");
	doc.setFontSize(8);
	doc.setTextColor(80);
	doc.text(i18n.periodLine, pageW / 2, y, { align: "center" });
	doc.setTextColor(0);
	y += 4;

	const head = [i18n.colDate, ...sectors.map((s) => s.name)];
	const body = days.map((day) => [
		formatDateLabel(day.date, i18n.weekdays, i18n.emptyCell),
		...sectors.map((s) => cellNames(day.bySector?.[s.id], i18n.emptyCell)),
	]);

	const fontSize = sectors.length >= 7 ? 6 : sectors.length >= 5 ? 6.5 : 7.5;

	autoTable(doc, {
		startY: y,
		head: [head],
		body,
		theme: "grid",
		styles: {
			font: "helvetica",
			fontSize,
			cellPadding: 1.2,
			valign: "middle",
			halign: "center",
			overflow: "linebreak",
			lineColor: [30, 30, 30],
			lineWidth: 0.15,
		},
		headStyles: {
			fillColor: [37, 99, 235],
			textColor: 255,
			fontStyle: "bold",
			halign: "center",
			valign: "middle",
			fontSize: Math.max(6, fontSize - 0.5),
		},
		columnStyles: {
			0: {
				cellWidth: 36,
				fontStyle: "bold",
				halign: "left",
				fillColor: [248, 250, 252],
			},
		},
		didParseCell: (data) => {
			if (data.section === "body" && data.row.index % 2 === 1) {
				data.cell.styles.fillColor = [241, 245, 249];
			}
		},
		margin: {
			left: marginX,
			right: marginX,
			top: 10,
			bottom: marginBottom,
		},
	});

	let cursorY = (doc.lastAutoTable?.finalY ?? y) + 8;
	const maxWidth = pageW - marginX * 2;

	const ensureSpace = (needed: number) => {
		if (cursorY + needed > pageH - marginBottom) {
			doc.addPage();
			cursorY = 14;
		}
	};

	ensureSpace(10);
	doc.setFont("helvetica", "bold");
	doc.setFontSize(10);
	doc.setTextColor(30);
	doc.text(i18n.tasksHeading, marginX, cursorY);
	cursorY += 5;
	doc.setDrawColor(37, 99, 235);
	doc.setLineWidth(0.4);
	doc.line(marginX, cursorY, marginX + 42, cursorY);
	cursorY += 5;

	for (const sector of sectors) {
		const name = sector.name;
		const task =
			sector.description && sector.description.length > 0
				? sector.description
				: i18n.noDescription;

		doc.setFont("helvetica", "bold");
		doc.setFontSize(9);
		const nameLines = doc.splitTextToSize(name, maxWidth) as string[];
		const nameBlockH = nameLines.length * 4;

		doc.setFont("helvetica", "normal");
		doc.setFontSize(8);
		const taskLines = doc.splitTextToSize(task, maxWidth) as string[];
		const taskBlockH = taskLines.length * 3.6;
		const blockH = nameBlockH + taskBlockH + 4;
		ensureSpace(blockH);

		doc.setFont("helvetica", "bold");
		doc.setFontSize(9);
		doc.setTextColor(15, 23, 42);
		doc.text(nameLines, marginX, cursorY);
		cursorY += nameBlockH + 1;

		doc.setFont("helvetica", "normal");
		doc.setFontSize(8);
		doc.setTextColor(71, 85, 105);
		doc.text(taskLines, marginX, cursorY);
		cursorY += taskBlockH + 3;
	}

	doc.setTextColor(0);
	const pageCount = doc.getNumberOfPages();
	for (let i = 1; i <= pageCount; i++) {
		doc.setPage(i);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(8);
		doc.setTextColor(120);
		doc.text(`${organizationName}  ${i}/${pageCount}`, pageW / 2, pageH - 6, {
			align: "center",
		});
		doc.setTextColor(0);
	}

	const safeName = safeText(input.fileName, "limpeza")
		.replace(/[^\w-]+/g, "_")
		.replace(/_+/g, "_");

	doc.save(`${safeName || "limpeza"}.pdf`);
}
