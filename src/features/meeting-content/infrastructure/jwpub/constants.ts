export const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;
export const MAX_EXPANDED_BYTES = 80 * 1024 * 1024;
export const DEFAULT_STUDY_COLOR = "#4A6FA5";

/** MEPS language index → ContentLocale */
export const LOCALE_BY_MEPS: Record<number, "pt" | "es"> = {
  1: "es",
  5: "pt",
};

export const SONG_KEY_SYMBOL = "sjjm";
export const STUDY_DOCUMENT_CLASS = "40";

export const ISSUE_SUFFIX_BY_LOCALE: Record<"pt" | "es", "T" | "S"> = {
  pt: "T",
  es: "S",
};
