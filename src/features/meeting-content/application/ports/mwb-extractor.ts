import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";

import type { MwbExtract } from "../dto/mwb-extract.dto";

export type ExtractMwbInput = {
	buffer: ArrayBuffer;
	fileName: string;
	locale?: ContentLocale;
};

export default interface MwbExtractor {
	extract(input: ExtractMwbInput): Promise<MwbExtract>;
}
