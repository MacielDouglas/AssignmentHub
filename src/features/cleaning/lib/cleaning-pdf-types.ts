export type CleaningPdfI18n = {
	colDate: string;
	/** Já formatado, ex.: "Período: 01/01/2026 a 31/01/2026" */
	periodLine: string;
	tasksHeading: string;
	noDescription: string;
	emptyCell: string;
	titleDefault: string;
	orgFallback: string;
	sectorFallback: string;
	weekdays: readonly [string, string, string, string, string, string, string];
	errNoSectors: string;
	errNoDays: string;
};

export type CleaningPdfSector = {
	id: string;
	name: string;
	description: string | null;
	sortOrder: number;
};

export type CleaningPdfDay = {
	date: string;
	bySector: Record<string, string[]>;
};

export type CleaningPdfInput = {
	organizationName: string;
	title: string;
	periodFrom: string;
	periodTo: string;
	sectors: CleaningPdfSector[];
	days: CleaningPdfDay[];
	fileName: string;
	i18n: CleaningPdfI18n;
};

export type SavedListDetailForPdf = {
	id: string;
	cleaningType: string;
	periodFrom: string;
	periodTo: string;
	days: Array<{
		date: string;
		assignments: Array<{
			id: string;
			sectorId: string;
			sectorName: string;
			sectorDescription: string | null;
			sortOrder: number;
			personId: string;
			personName: string;
			position: number;
			isManual: boolean;
			familyId: string | null;
			groupId: string | null;
		}>;
	}>;
};
