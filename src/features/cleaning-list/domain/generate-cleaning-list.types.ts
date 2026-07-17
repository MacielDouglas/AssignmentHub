import type { CleaningGenerationResult } from "./cleaning-list.types";

export type GenerateCleaningListState = {
	success: boolean;
	message: string;
	errors: Record<string, string[]>;
	result: CleaningGenerationResult | null;
};

export const initialGenerateCleaningListState: GenerateCleaningListState = {
	success: false,
	message: "",
	errors: {},
	result: null,
};
