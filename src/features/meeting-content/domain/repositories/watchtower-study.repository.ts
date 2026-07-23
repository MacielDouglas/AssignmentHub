import type { WatchtowerStudyEntity } from "../entities/watchtower-study";
import type { ContentLocale } from "../values-objects/content-locale";

export type UpsertWatchtowerStudyInput = {
  locale: ContentLocale;
  weekStart: Date;
  weekEnd: Date;
  weekLabelRaw: string | null;
  title: string;
  openingSongNum: number;
  closingSongNum: number;
  highlightColor: string | null;
  issueCode: string | null;
  openingSongId: string | null;
  closingSongId: string | null;
};

export type UpdateWatchtowerStudyInput = {
  id: string;
  locale: ContentLocale;
  weekStart: Date;
  weekEnd: Date;
  weekLabelRaw: string;
  title: string;
  openingSongNum: number;
  closingSongNum: number;
  highlightColor: string | null;
  issueCode: string | null;
  openingSongId: string | null;
  closingSongId: string | null;
};

export interface WatchtowerStudyRepository {
  list(locale?: ContentLocale): Promise<WatchtowerStudyEntity[]>;

  countByLocale(): Promise<Array<{ locale: ContentLocale; count: number }>>;

  upsertByWeek(input: UpsertWatchtowerStudyInput): Promise<void>;

  updateById(input: UpdateWatchtowerStudyInput): Promise<void>;

  deleteByIds(ids: string[]): Promise<number>;

  deleteAll(locale?: ContentLocale): Promise<number>;

  findSongId(number: number, locale: ContentLocale): Promise<string | null>;
}
