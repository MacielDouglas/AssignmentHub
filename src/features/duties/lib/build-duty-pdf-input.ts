import type { DutyPdfHeadCell, DutyPdfInput } from "./duty-pdf-types";
import {
	DUTY_SECTORS,
	type DutyMeetingDraft,
	type DutySectorKey,
} from "./duty-types";

export type DutyPdfColumn = {
	key: string;
	sector: DutySectorKey;
	postLabel: string;
	side: "externo" | "interno" | null;
	header: string;
};

export function collectDutyColumns(
	meetings: DutyMeetingDraft[],
	sectorName: (sector: DutySectorKey) => string,
): DutyPdfColumn[] {
	const seen = new Map<string, DutyPdfColumn>();

	for (const meeting of meetings) {
		for (const slot of meeting.slots) {
			if (slot.sector !== "indicator") {
				const key = `${slot.sector}|`;

				if (!seen.has(key)) {
					seen.set(key, {
						key,
						sector: slot.sector,
						postLabel: "",
						side: null,
						header: sectorName(slot.sector),
					});
				}

				continue;
			}

			const side = slot.side === "interno" ? "interno" : "externo";
			const key = `indicator|${side}`;

			if (!seen.has(key)) {
				seen.set(key, {
					key,
					sector: "indicator",
					postLabel: "",
					side,
					header: "",
				});
			}
		}
	}

	return [...seen.values()].sort((a, b) => {
		const orderA = DUTY_SECTORS.indexOf(a.sector);
		const orderB = DUTY_SECTORS.indexOf(b.sector);

		if (orderA !== orderB) {
			return orderA - orderB;
		}

		if (a.side === "externo" && b.side === "interno") {
			return -1;
		}

		if (a.side === "interno" && b.side === "externo") {
			return 1;
		}

		return 0;
	});
}

function formatDateLabel(iso: string): string {
	const [year, month, day] = iso.split("-");

	return `${day}/${month}/${year}`;
}

function weekdayOf(iso: string): number {
	const [year, month, day] = iso.split("-").map(Number);

	return new Date(year, (month ?? 1) - 1, day).getDay();
}

export type BuildDutyPdfOpts = {
	title: string;
	periodLine: string;
	colDate: string;
	emptyCell: string;
	organizationName: string;
	filePrefix: string;
	sectorName: (sector: DutySectorKey) => string;
	externoLabel: string;
	internoLabel: string;
	weekdays: string[];
};

export function buildDutyPdfInput(
	meetings: DutyMeetingDraft[],
	periodFrom: string,
	periodTo: string,
	opts: BuildDutyPdfOpts,
): DutyPdfInput {
	const columns = collectDutyColumns(meetings, opts.sectorName);
	const columnIndex = new Map(
		columns.map((column, index) => [column.key, index]),
	);
	const hasIndicator = columns.some((column) => column.sector === "indicator");

	const head: DutyPdfHeadCell[][] = hasIndicator
		? [
				[
					{ content: opts.colDate, rowSpan: 2 },
					{
						content: opts.sectorName("indicator"),
						colSpan: 2,
					},
					...columns
						.filter((column) => column.sector !== "indicator")
						.map((column) => ({ content: column.header, rowSpan: 2 })),
				],
				[{ content: opts.externoLabel }, { content: opts.internoLabel }],
			]
		: [[opts.colDate, ...columns.map((column) => column.header)]];

	const rows = meetings.map((meeting) => {
		const names: string[][] = columns.map(() => []);

		for (const slot of meeting.slots) {
			const key =
				slot.sector === "indicator"
					? `indicator|${slot.side === "interno" ? "interno" : "externo"}`
					: `${slot.sector}|`;
			const index = columnIndex.get(key);

			if (index !== undefined) {
				names[index].push(slot.personName || opts.emptyCell);
			}
		}

		return {
			date: `${formatDateLabel(meeting.date)} · ${opts.weekdays[weekdayOf(meeting.date)] ?? ""}`,
			cells: names.map((cell) => cell.join(" - ") || opts.emptyCell),
		};
	});

	return {
		organizationName: opts.organizationName.trim() || opts.organizationName,
		title: opts.title,
		periodLine: opts.periodLine,
		head,
		rows,
		fileName: `${opts.filePrefix}-${periodFrom}_${periodTo}.pdf`,
	};
}
