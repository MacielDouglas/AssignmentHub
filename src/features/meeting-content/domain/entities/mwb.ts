import type { ContentLocale } from "../values-objects/content-locale";

export type MwbPartEntity = {
	id: string;
	sortOrder: number;
	title: string;
	theme: string | null;
	durationMin: number | null;
	modality: string | null;
	source: string | null;
};

export type MwbSectionEntity = {
	id: string;
	name: string;
	code: "TREASURES" | "APPLY" | "LIVING" | null;
	sortOrder: number;
	parts: MwbPartEntity[];
};

export type MwbWeekEntity = {
	id: string;
	weekStart: string;
	weekEnd: string;
	weekLabelRaw: string | null;
	dateRangeRaw: string | null;
	openingSongNum: number | null;
	middleSongNum: number | null;
	closingSongNum: number | null;
	sortOrder: number;
	sections: MwbSectionEntity[];
};

export type MwbIssueEntity = {
	id: string;
	locale: ContentLocale;
	symbol: string;
	title: string;
	coverTitle: string | null;
	year: number | null;
	month: number | null;
	weeksCount: number;
	weeks: MwbWeekEntity[];
};
