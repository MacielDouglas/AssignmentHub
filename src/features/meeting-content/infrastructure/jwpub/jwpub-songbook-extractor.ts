import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import initSqlJs from "sql.js/dist/sql-asm.js";
import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";
import type { SongbookExtract } from "../../application/dto/songbook-extract.dto";
import { sanitizeSongbookExtract } from "../../application/dto/songbook-extract.dto";
import type { SongbookExtractor } from "../../application/ports/songbook-extractor";
import { MAX_EXPANDED_BYTES } from "./constants";
import { unzipToDir } from "./unzip";

type ManifestPub = {
	fileName?: string;
	language?: number | string;
	symbol?: string;
	uniqueEnglishSymbol?: string;
};

const LOCALE_BY_MEPS: Record<number, ContentLocale> = {
	1: "es",
	5: "pt",
};

function detectLocale(
	language: number | string | undefined,
	fallback: ContentLocale,
): ContentLocale {
	const n = Number(language);
	if (Number.isFinite(n) && LOCALE_BY_MEPS[n]) return LOCALE_BY_MEPS[n];

	const s = String(language ?? "").toLowerCase();
	if (s === "t" || s.startsWith("pt")) return "pt";
	if (s === "s" || s.startsWith("es")) return "es";
	return fallback;
}

export class JwpubSongbookExtractor implements SongbookExtractor {
	async extract(
		buffer: ArrayBuffer,
		fileName: string,
		locale: ContentLocale,
	): Promise<SongbookExtract> {
		const tempDir = await mkdtemp(join(tmpdir(), "jwpub-sjj-"));
		try {
			const jwpubPath = join(tempDir, `${randomUUID()}.jwpub`);
			await writeFile(jwpubPath, Buffer.from(buffer));

			const outerDir = join(tempDir, "outer");
			const innerDir = join(tempDir, "inner");
			await unzipToDir(jwpubPath, outerDir, MAX_EXPANDED_BYTES);

			const manifestRaw = await readFile(
				join(outerDir, "manifest.json"),
				"utf8",
			);
			const manifest = JSON.parse(manifestRaw) as { publication?: ManifestPub };
			const publication = manifest.publication ?? {};

			const symbol =
				publication.uniqueEnglishSymbol ?? publication.symbol ?? null;

			if (symbol && !/^sjj/i.test(symbol)) {
				throw new Error(
					`Este arquivo não parece ser o livro de cânticos (symbol=${symbol}). Esperado sjj*.`,
				);
			}

			if (!publication.fileName) {
				throw new Error("manifest.json sem publication.fileName");
			}

			await unzipToDir(
				join(outerDir, "contents"),
				innerDir,
				MAX_EXPANDED_BYTES,
			);

			const dbBuffer = await readFile(join(innerDir, publication.fileName));
			const SQL = await initSqlJs();
			const database = new SQL.Database(new Uint8Array(dbBuffer));

			try {
				const statement = database.prepare(`
          SELECT ChapterNumber AS songNumber, Title AS theme
          FROM Document
          WHERE Class = 31 AND ChapterNumber IS NOT NULL
          ORDER BY ChapterNumber
        `);

				const songs: Array<{ number: number; title: string }> = [];
				try {
					while (statement.step()) {
						const row = statement.getAsObject() as Record<string, unknown>;
						const number = Number(row.songNumber);
						const title = String(row.theme ?? "").trim();
						if (Number.isInteger(number) && number >= 1 && title) {
							songs.push({ number, title });
						}
					}
				} finally {
					statement.free();
				}

				const resolvedLocale = detectLocale(publication.language, locale);

				return sanitizeSongbookExtract({
					locale: resolvedLocale,
					symbol,
					songs,
					notes: `Extraído de ${fileName}${symbol ? ` (${symbol})` : ""}.`,
				});
			} finally {
				database.close();
			}
		} finally {
			await rm(tempDir, { recursive: true, force: true }).catch(
				() => undefined,
			);
		}
	}
}
