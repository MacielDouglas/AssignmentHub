import { readFile } from "node:fs/promises";
import { join } from "node:path";

import initSqlJs, {
	type Database as SqlJsDatabase,
} from "sql.js/dist/sql-asm.js";

import type { PublicTalksExtract } from "../../application/dto/public-talks-extract.dto";
import type { ContentLocale } from "../../domain/values-objects/content-locale";
import { LOCALE_BY_MEPS, MAX_EXPANDED_BYTES } from "./constants";
import { unzipToDir } from "./unzip";

const TALK_DOCUMENT_CLASS = 34;

type ManifestPub = {
	fileName?: string;
	language?: number;
	symbol?: string;
	uniqueEnglishSymbol?: string;
	title?: string;
};

function isPublicTalks(pub: ManifestPub): boolean {
	const symbol = String(pub.uniqueEnglishSymbol ?? pub.symbol ?? "");
	return /^S-34/i.test(symbol);
}

function parseTalkTitle(raw: string): { number: number; title: string } | null {
	const text = raw.replace(/\s+/g, " ").trim();
	if (!text) return null;

	const m = text.match(/^(\d{1,3})[.)]\s*(.+)$/);
	if (m) {
		const number = Number(m[1]);
		const title = m[2].trim();
		if (number >= 1 && number <= 999 && title) return { number, title };
	}

	return null;
}

function queryTalks(
	db: SqlJsDatabase,
): Array<{ number: number; title: string }> {
	const statement = db.prepare(`
    SELECT Title AS theme
    FROM Document
    WHERE Class = ${TALK_DOCUMENT_CLASS}
    ORDER BY DocumentId
  `);

	const talks: Array<{ number: number; title: string }> = [];
	try {
		while (statement.step()) {
			const row = statement.getAsObject() as { theme?: string };
			const parsed = parseTalkTitle(String(row.theme ?? ""));
			if (parsed) talks.push(parsed);
		}
	} finally {
		statement.free();
	}
	return talks;
}

export async function extractPublicTalksFromJwpubFile(
	jwpubPath: string,
	tempDir: string,
): Promise<PublicTalksExtract> {
	const outerDir = join(tempDir, "outer");
	const innerDir = join(tempDir, "inner");

	await unzipToDir(jwpubPath, outerDir, MAX_EXPANDED_BYTES);

	const manifestRaw = await readFile(join(outerDir, "manifest.json"), "utf8");
	const manifest = JSON.parse(manifestRaw) as { publication?: ManifestPub };
	const publication = manifest.publication ?? {};

	if (!isPublicTalks(publication)) {
		throw Object.assign(
			new Error("O arquivo não é o esboço de discursos públicos S-34."),
			{ code: "BAD_PUBLICATION" },
		);
	}

	const mepsLanguage = Number(publication.language);
	const locale = LOCALE_BY_MEPS[mepsLanguage] as ContentLocale | undefined;
	if (!locale) {
		throw Object.assign(
			new Error(
				`Idioma não suportado (MEPS ${mepsLanguage}). Use português (5) ou espanhol (1).`,
			),
			{ code: "BAD_LANG" },
		);
	}

	if (!publication.fileName) {
		throw Object.assign(new Error("manifest.json sem publication.fileName."), {
			code: "BAD_MANIFEST",
		});
	}

	await unzipToDir(join(outerDir, "contents"), innerDir, MAX_EXPANDED_BYTES);

	const databasePath = join(innerDir, publication.fileName);
	const databaseBuffer = await readFile(databasePath);
	const SQL = await initSqlJs();
	const database = new SQL.Database(new Uint8Array(databaseBuffer));

	try {
		const talks = queryTalks(database);
		if (talks.length === 0) {
			throw Object.assign(
				new Error("Nenhum discurso (Class 34) encontrado no arquivo."),
				{ code: "EXTRACT_FAIL" },
			);
		}

		const fileHint = publication.fileName;
		return {
			locale,
			talks,
			notes: `Extraído de ${fileHint} (S-34 / JWPUB estrutural).`,
		};
	} finally {
		database.close();
	}
}
