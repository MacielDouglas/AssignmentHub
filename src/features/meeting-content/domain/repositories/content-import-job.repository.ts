import type { ContentImportJobEntity } from "@/features/meeting-content/domain/entities/watchtower-study";
import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";

export type ContentImportSourceType =
	| "WATCHTOWER"
	| "SONGBOOK"
	| "PUBLIC_TALKS"
	| "MWB";

export type CreateImportJobInput = {
	sourceType: ContentImportSourceType;
	locale: ContentLocale;
	fileNames: string[];
};

export interface ContentImportJobRepository {
	createProcessing(
		input: CreateImportJobInput,
	): Promise<ContentImportJobEntity>;

	markAwaitingReview(input: {
		id: string;
		extractedJson: unknown;
		notes?: string | null;
	}): Promise<ContentImportJobEntity>;

	markFailed(id: string, errorMessage: string): Promise<void>;

	markCommitted(id: string): Promise<void>;

	updateDraft(
		id: string,
		extractedJson: unknown,
	): Promise<ContentImportJobEntity>;

	findById(id: string): Promise<ContentImportJobEntity | null>;

	findLatestPending(
		sourceType: ContentImportSourceType,
	): Promise<ContentImportJobEntity | null>;

	findLatestPendingWatchtower(): Promise<ContentImportJobEntity | null>;

	discard(id: string): Promise<void>;
}
