export type DutyPdfHeadCell =
	| string
	| {
			content: string;
			colSpan?: number;
			rowSpan?: number;
	  };

export type DutyPdfRow = {
	date: string;
	cells: string[];
};

export type DutyPdfInput = {
	organizationName: string;
	title: string;
	periodLine: string;
	head: DutyPdfHeadCell[][];
	rows: DutyPdfRow[];
	fileName: string;
};
