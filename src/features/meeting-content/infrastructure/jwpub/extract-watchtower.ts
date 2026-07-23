import { readFile } from "node:fs/promises";
import { join } from "node:path";
import initSqlJs, {
  type Database as SqlJsDatabase,
} from "sql.js/dist/sql-asm.js";

import type { WatchtowerExtract } from "@/features/meeting-content/application/dto/watchtower-extract.dto";
import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";
import { parseStudyWeekLabel } from "@/features/meeting-content/domain/values-objects/study-week";

import { assignColorsToStudies, extractCoverColors } from "./colors";
import {
  DEFAULT_STUDY_COLOR,
  LOCALE_BY_MEPS,
  MAX_EXPANDED_BYTES,
  SONG_KEY_SYMBOL,
  STUDY_DOCUMENT_CLASS,
} from "./constants";
import { unzipToDir } from "./unzip";

type ManifestImage = {
  fileName?: string;
  type?: string;
};

type ManifestPub = {
  fileName?: string;
  language?: number;
  publicationType?: string;
  categories?: string[];
  symbol?: string;
  uniqueEnglishSymbol?: string;
  undatedSymbol?: string;
  year?: number;
  issueTagNumber?: string | number;
  issueNumber?: string | number;
  issueProperties?: {
    title?: string;
  };
  images?: ManifestImage[];
  shortTitle?: string;
  title?: string;
};

type SongRow = {
  documentId: number;
  theme: string;
  week: string;
  songNumber: number;
  ordinal: number;
};

type ExtractedArticle = {
  weekLabelRaw: string;
  weekStart: string | null;
  weekEnd: string | null;
  title: string;
  openingSong: number;
  closingSong: number;
};

function isWatchtower(pub: ManifestPub): boolean {
  const symbol = String(pub.uniqueEnglishSymbol ?? pub.symbol ?? "");
  const undated = String(pub.undatedSymbol ?? "").toLowerCase();
  const publicationType = String(pub.publicationType ?? "");
  const categories = pub.categories ?? [];

  return (
    publicationType === "Watchtower" ||
    categories.includes("w") ||
    /^w\d*/i.test(symbol) ||
    undated === "w"
  );
}

/**
 * Exemplos:
 * - `w26` + edição 07 em espanhol → `w26.07-S`
 * - `w26` + edição 07 em português → `w26.07-T`
 */
function buildIssueCode(
  pub: ManifestPub,
  locale: ContentLocale,
): string | null {
  const symbol = String(pub.uniqueEnglishSymbol ?? pub.symbol ?? "").trim();
  if (!symbol) return null;

  const suffix = locale === "pt" ? "T" : "S";
  const issueNumber = Number(pub.issueNumber);

  if (
    Number.isInteger(issueNumber) &&
    issueNumber >= 1 &&
    issueNumber <= 12
  ) {
    return `${symbol}.${String(issueNumber).padStart(2, "0")}-${suffix}`;
  }

  /*
   * Fallback para arquivos que não tenham issueNumber.
   * Exemplo de issueTagNumber: 20260700 ou 202607.
   * O mês são os caracteres 5 e 6: 07.
   */
  const issueTag = String(pub.issueTagNumber ?? "").replace(/\D/g, "");

  if (issueTag.length >= 6) {
    const month = Number(issueTag.slice(4, 6));

    if (month >= 1 && month <= 12) {
      return `${symbol}.${String(month).padStart(2, "0")}-${suffix}`;
    }
  }

  return `${symbol}-${suffix}`;
}

function querySongRows(db: SqlJsDatabase): SongRow[] {
  const statement = db.prepare(`
    SELECT
      d.DocumentId AS documentId,
      d.Title AS theme,
      d.ContextTitle AS week,
      m.Track AS songNumber,
      dm.BeginParagraphOrdinal AS ordinal
    FROM Document d
    JOIN DocumentMultimedia dm
      ON dm.DocumentId = d.DocumentId
    JOIN Multimedia m
      ON m.MultimediaId = dm.MultimediaId
    WHERE d.Class = '${STUDY_DOCUMENT_CLASS}'
      AND m.KeySymbol = '${SONG_KEY_SYMBOL}'
      AND m.Track IS NOT NULL
    ORDER BY d.DocumentId, dm.BeginParagraphOrdinal
  `);

  const rows: SongRow[] = [];

  try {
    while (statement.step()) {
      const row = statement.getAsObject() as Record<string, unknown>;

      rows.push({
        documentId: Number(row.documentId),
        theme: String(row.theme ?? ""),
        week: String(row.week ?? ""),
        songNumber: Number(row.songNumber),
        ordinal: Number(row.ordinal ?? 0),
      });
    }
  } finally {
    statement.free();
  }

  return rows;
}

function groupSongsByDocument(rows: SongRow[]): Map<number, SongRow[]> {
  const byDocument = new Map<number, SongRow[]>();

  for (const row of rows) {
    const songs = byDocument.get(row.documentId) ?? [];
    songs.push(row);
    byDocument.set(row.documentId, songs);
  }

  return byDocument;
}

function extractArticles(
  groupedSongs: Map<number, SongRow[]>,
  year: number | undefined,
): ExtractedArticle[] {
  const articles: ExtractedArticle[] = [];

  for (const songs of groupedSongs.values()) {
    if (songs.length < 2) continue;

    const first = songs[0];
    const last = songs.at(-1);

    if (!first || !last) continue;

    const openingSong = Number(first.songNumber);
    const closingSong = Number(last.songNumber);

    if (
      !Number.isInteger(openingSong) ||
      !Number.isInteger(closingSong) ||
      openingSong < 1 ||
      closingSong < 1
    ) {
      continue;
    }

    const title = first.theme.trim();
    const weekLabelRaw = first.week.trim();

    if (!title) continue;

    const parsedWeek = parseStudyWeekLabel(weekLabelRaw, year);

    articles.push({
      weekLabelRaw,
      weekStart: parsedWeek?.weekStart ?? null,
      weekEnd: parsedWeek?.weekEnd ?? null,
      title,
      openingSong,
      closingSong,
    });
  }

  return articles;
}

/**
 * Extrai estudos de A Sentinela a partir de um arquivo .jwpub salvo em disco.
 *
 * A identificação é estrutural:
 * - Document.Class = 40 identifica artigos de estudo;
 * - Multimedia.KeySymbol = sjjm identifica os cânticos;
 * - primeiro e último cânticos do artigo são inicial e final;
 * - cor vem da capa do JWPUB e é distribuída em pares de estudos.
 */
export async function extractWatchtowerFromJwpubFile(
  jwpubPath: string,
  tempDir: string,
): Promise<WatchtowerExtract> {
  const outerDir = join(tempDir, "outer");
  const innerDir = join(tempDir, "inner");

  await unzipToDir(jwpubPath, outerDir, MAX_EXPANDED_BYTES);

  const manifestRaw = await readFile(join(outerDir, "manifest.json"), "utf8");
  const manifest = JSON.parse(manifestRaw) as {
    publication?: ManifestPub;
  };
  const publication = manifest.publication ?? {};

  if (!isWatchtower(publication)) {
    throw Object.assign(
      new Error("O arquivo não é uma edição de estudo de A Sentinela."),
      { code: "BAD_PUBLICATION" },
    );
  }

  const mepsLanguage = Number(publication.language);
  const locale = LOCALE_BY_MEPS[mepsLanguage];

  if (!locale) {
    throw Object.assign(
      new Error(
        `Idioma não suportado (MEPS language=${mepsLanguage}). Use português (5) ou espanhol (1).`,
      ),
      { code: "BAD_LANG" },
    );
  }

  if (!publication.fileName) {
    throw Object.assign(
      new Error("manifest.json sem publication.fileName."),
      { code: "BAD_MANIFEST" },
    );
  }

  await unzipToDir(
    join(outerDir, "contents"),
    innerDir,
    MAX_EXPANDED_BYTES,
  );

  const databasePath = join(innerDir, publication.fileName);
  const databaseBuffer = await readFile(databasePath);

  const SQL = await initSqlJs();
  const database = new SQL.Database(new Uint8Array(databaseBuffer));

  try {
    const rows = querySongRows(database);
    const songsByDocument = groupSongsByDocument(rows);

    const extractedArticles = extractArticles(
      songsByDocument,
      Number(publication.year) || undefined,
    );

    if (extractedArticles.length === 0) {
      throw Object.assign(
        new Error(
          "Nenhum estudo com cântico inicial e final foi encontrado no arquivo.",
        ),
        { code: "EXTRACT_FAIL" },
      );
    }

    /*
     * Falhar ao ler a imagem de capa não pode impedir a importação.
     * extractCoverColors já retorna o fallback, mas este catch protege
     * contra JPEG inválido ou mudança futura do pacote.
     */
    let coverColors: string[] = [DEFAULT_STUDY_COLOR];

    try {
      coverColors = await extractCoverColors(innerDir, publication.images);
    } catch {
      coverColors = [DEFAULT_STUDY_COLOR];
    }

    const studyColors = assignColorsToStudies(
      coverColors,
      extractedArticles.length,
    );

    const articles: WatchtowerExtract["articles"] = extractedArticles.map(
      (article, index) => ({
        ...article,
        highlightColor: studyColors[index] ?? DEFAULT_STUDY_COLOR,
      }),
    );

    const issueCode = buildIssueCode(publication, locale);
    const fileHint = publication.fileName;

    return {
      locale,
      issueCode,
      articles,
      notes: `Extraído de ${fileHint} (JWPUB estrutural, sem IA).`,
    };
  } finally {
    database.close();
  }
}
