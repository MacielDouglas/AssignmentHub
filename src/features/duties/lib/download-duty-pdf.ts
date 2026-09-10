"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { DutyPdfInput } from "@/features/duties/lib/duty-pdf-types";

type JsPdfWithAutoTable = jsPDF & {
	lastAutoTable?: { finalY: number };
};

export function downloadDutyPdf(input: DutyPdfInput): void {
	if (input.head.length === 0) {
		throw new Error("No data");
	}

	if (input.rows.length === 0) {
		throw new Error("No data");
	}

	const doc = new jsPDF({
		orientation: "portrait",
		unit: "mm",
		format: "a4",
	}) as JsPdfWithAutoTable;

	const pageW = doc.internal.pageSize.getWidth();
	let y = 12;

	doc.setFont("helvetica", "bold");
	doc.setFontSize(13);
	doc.text(input.organizationName, pageW / 2, y, { align: "center" });
	y += 6;
	doc.setFontSize(14);
	doc.text(input.title, pageW / 2, y, { align: "center" });
	y += 5;
	doc.setFont("helvetica", "normal");
	doc.setFontSize(8);
	doc.setTextColor(80);
	doc.text(input.periodLine, pageW / 2, y, { align: "center" });
	doc.setTextColor(0);
	y += 4;

	autoTable(doc, {
		startY: y,
		head: input.head,
		body: input.rows.map((row) => [row.date, ...row.cells]),
		theme: "grid",
		styles: {
			font: "helvetica",
			fontSize: 12,
			cellPadding: 2,
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
		},
		alternateRowStyles: {
			fillColor: [245, 245, 245],
		},
		didDrawPage: (data) => {
			const pageCount = doc.getNumberOfPages();
			doc.setFont("helvetica", "normal");
			doc.setFontSize(8);
			doc.setTextColor(100);
			doc.text(
				`${input.organizationName} · ${data.pageNumber}/${pageCount}`,
				pageW / 2,
				doc.internal.pageSize.getHeight() - 8,
				{ align: "center" },
			);
		},
	});

	doc.save(input.fileName);
}
