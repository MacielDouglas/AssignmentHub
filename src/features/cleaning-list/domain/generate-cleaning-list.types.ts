// src/features/cleaning-list/domain/generate-cleaning-list.types.ts
import type { CleaningGenerationResult } from "./cleaning-list.types";

export type GenerateCleaningListState = {
	success: boolean;
	message: string;
	errors: Record<string, string[] | undefined>;
	result: CleaningGenerationResult | null;
};

export const initialGenerateCleaningListState: GenerateCleaningListState = {
	success: false,
	message: "",
	errors: {},
	result: null,
};
