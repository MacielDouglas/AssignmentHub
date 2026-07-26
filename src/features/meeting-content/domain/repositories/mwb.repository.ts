import type { MwbExtract } from "../../application/dto/mwb-extract.dto";
import type { MwbIssueEntity } from "../entities/mwb";
import type { ContentLocale } from "../values-objects/content-locale";

export type CommitMwbResult = {
	issueId: string;
	issuesUpserted: number;
	weeksUpserted: number;
	sectionsCreated: number;
	partsCreated: number;
};

export type MwbLocaleCount = {
	locale: ContentLocale;
	count: number;
};

export default interface MwbRepository {
	commitExtract(data: MwbExtract): Promise<CommitMwbResult>;
	listIssues(locale?: ContentLocale): Promise<MwbIssueEntity[]>;
	countByLocale(): Promise<MwbLocaleCount[]>;
	deleteIssue(id: string): Promise<boolean>;
	deleteIssuesByLocale(locale: ContentLocale): Promise<number>;
}
