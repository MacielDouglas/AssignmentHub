export type CleaningPdfSector = {
	id: string;
	name: string;
	description: string | null;
	sortOrder: number;
};

export type CleaningPdfDay = {
	/** yyyy-mm-dd */
	date: string;
	/** nomes por sectorId, ordem de position */
	bySector: Record<string, string[]>;
};

export type CleaningPdfInput = {
	organizationName: string;
	title: string;
	periodFrom: string;
	periodTo: string;
	sectors: CleaningPdfSector[];
	days: CleaningPdfDay[];
	fileName?: string;
};

/** Detalhe serializável da lista salva (PDF + UI) */
export type SavedListDetailForPdf = {
	id: string;
	cleaningType: "MEETING" | "WEEKLY" | "GENERAL";
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
