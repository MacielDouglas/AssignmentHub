import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";

export type ContentImportJobStatus =
	| "PENDING"
	| "PROCESSING"
	| "AWAITING_REVIEW"
	| "COMMITTED"
	| "FAILED";

export type ContentImportJobEntity = {
	id: string;
	sourceType: "WATCHTOWER" | "SONGBOOK" | "PUBLIC_TALKS" | "MWB";
	locale: ContentLocale;
	status: ContentImportJobStatus;
	extractedJson: unknown | null;
	notes: string | null;
	errorMessage: string | null;
	fileNames: string[];
	createdAt: string;
	committedAt: string | null;
};

export type WatchtowerStudyEntity = {
	id: string;
	locale: ContentLocale;
	weekStart: string;
	weekEnd: string;
	weekLabelRaw: string | null;
	title: string;
	openingSongNum: number;
	closingSongNum: number;
	highlightColor: string | null;
	issueCode: string | null;
	openingSongTitle: string | null;
	closingSongTitle: string | null;
	createdAt: string;
	updatedAt: string;
};
