import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";

export type SongEntity = {
	id: string;
	number: number;
	title: string;
	locale: ContentLocale;
	createdAt: string;
	updatedAt: string;
};

export type SongImportJobEntity = {
	id: string;
	sourceType: "SONGBOOK";
	locale: ContentLocale;
	status: "PENDING" | "PROCESSING" | "AWAITING_REVIEW" | "COMMITTED" | "FAILED";
	extractedJson: unknown | null;
	notes: string | null;
	errorMessage: string | null;
	fileNames: string[];
	createdAt: string;
	committedAt: string | null;
};
