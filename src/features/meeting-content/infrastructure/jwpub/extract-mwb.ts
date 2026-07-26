import { createDecipheriv, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { inflateSync } from "node:zlib";
import initSqlJs, {
	type Database as SqlJsDatabase,
} from "sql.js/dist/sql-asm.js";
import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";
import {
	type MwbExtract,
	type MwbSectionExtract,
	type MwbWeekExtract,
	sanitizeMwbExtract,
} from "../../application/dto/mwb-extract.dto";
import { LOCALE_BY_MEPS, MAX_EXPANDED_BYTES } from "./constants";
import { unzipToDir } from "./unzip";

const AES_XOR_CONST = Buffer.from(
	"11cbb5587e32846d4c26790c633da289f66fe5842a3a585ce1bc3a294af5ada7",
	"hex",
);

const SECTION_HEADINGS = new Set([
	"TESOROS DE LA BIBLIA",
	"TESOUROS DA BIBLIA",
	"SEAMOS MEJORES MAESTROS",
	"FACAMOS MELHORES MESTRES",
	"NUESTRA VIDA CRISTIANA",
	"NOSSA VIDA CRISTA",
]);

const GENERIC_PART_TYPES = new Set([
	"Busquemos perlas escondidas",
	"Busquemos perolas escondidas",
	"Leitura da Biblia",
	"Lectura de la Biblia",
	"Estudo biblico de congregacao",
	"Estudio biblico de la congregacion",
	"Discurso",
	"Comece conversas",
	"Empiece conversaciones",
	"Faca revisitas",
	"Haga revisitas",
	"Faca discipulos",
	"Haga discipulos",
	"Explique suas crencas",
	"Explique sus creencias",
	"Necessidades da congregacao",
	"Necesidades de la congregacion",
]);

const FORMAT_MARKERS = [
	"DE CASA EN CASA",
	"PREDICACAO INFORMAL",
	"PREDICACION INFORMAL",
	"PREDICACAO PUBLICA",
	"PREDICACION PUBLICA",
	"Discurso",
	"Encenacao",
	"Escenificacion",
	"Analise com o auditorio",
	"Analisis con el auditorio",
] as const;

type ManifestPub = {
	fileName?: string;
	language?: number | string;
	publicationType?: string | number;
	categories?: string[];
	symbol?: string;
	uniqueEnglishSymbol?: string;
	undatedSymbol?: string;
	year?: number | string;
	issueTagNumber?: string | number;
	issueNumber?: string | number;
	shortTitle?: string;
	title?: string;
	issueProperties?: {
		title?: string;
		coverTitle?: string;
	};
};

type PubRow = {
	MepsLanguageIndex: number;
	Symbol: string;
	Year: number;
	IssueTagNumber: string | number | null;
	Title?: string | null;
	IssueNumber?: number | null;
};

type DatedTextRow = {
	DatedTextId: number;
	DocumentId: number;
	Caption: string | null;
	FirstDateOffset: number;
	LastDateOffset: number;
	BeginParagraphOrdinal: number;
	EndParagraphOrdinal: number;
	Content: Uint8Array | null;
};

type ExtractRow = {
	ExtractId: number;
	Caption: string | null;
	Link: string | null;
};

type DocExtractRow = {
	DocumentId: number;
	ExtractId: number;
	BeginParagraphOrdinal: number;
	EndParagraphOrdinal: number | null;
};

type SongRow = {
	DocumentId: number;
	BeginParagraphOrdinal: number;
	Track: number;
	KeySymbol: string;
	Label: string | null;
};

type IssuePropRow = {
	Title?: string | null;
	CoverTitle?: string | null;
	Symbol?: string | null;
};

type HtmlElement = {
	tag: string;
	attributes: Record<string, string>;
	text: string;
	start: number;
};

type Boundary = {
	tag: "section" | "activity";
	name: string;
	pid: number;
};

type SectionActivities = {
	name: string;
	activities: Array<{ pid: number; name: string }>;
};

function normalizeWhitespace(value: unknown): string {
	return String(value ?? "")
		.replace(/\s+/g, " ")
		.trim();
}

function decodeHtmlEntities(value: string): string {
	return value
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&quot;/gi, '"')
		.replace(/&#34;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&apos;/gi, "'")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">");
}

function htmlToText(value: string): string {
	return normalizeWhitespace(
		decodeHtmlEntities(
			value
				.replace(/<br\s*\/?>/gi, " ")
				.replace(/<\/p>/gi, " ")
				.replace(/<\/h[1-6]>/gi, " ")
				.replace(/<[^>]+>/g, " "),
		),
	);
}

function normalizeForMatch(value: string): string {
	return htmlToText(value)
		.toUpperCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

function parseAttributes(raw: string): Record<string, string> {
	const attrs: Record<string, string> = {};
	const re =
		/([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

	let match = re.exec(raw);
	while (match !== null) {
		const name = match[1]?.toLowerCase();
		if (name) {
			attrs[name] = decodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? "");
		}
		match = re.exec(raw);
	}

	return attrs;
}

function parseHtmlElements(html: string): HtmlElement[] {
	const elements: HtmlElement[] = [];
	const re = /<(h2|h3|p)\b([^>]*)>([\s\S]*?)<\/\1\s*>/gi;

	let match = re.exec(html);
	while (match !== null) {
		const tag = match[1]?.toLowerCase() ?? "";
		if (tag) {
			elements.push({
				tag,
				attributes: parseAttributes(match[2] ?? ""),
				text: htmlToText(match[3] ?? ""),
				start: match.index,
			});
		}
		match = re.exec(html);
	}

	return elements;
}

function getPid(element: HtmlElement): number | null {
	const pid = Number.parseInt(element.attributes["data-pid"] ?? "", 10);
	return Number.isInteger(pid) && pid > 0 ? pid : null;
}

function getClass(element: HtmlElement): string {
	return element.attributes.class ?? "";
}

function getXmlTagText(html: string, tagName: string): string {
	const re = new RegExp(
		`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}\\s*>`,
		"i",
	);
	const match = html.match(re);
	return match ? htmlToText(match[1] ?? "") : "";
}

function parseCaptionLabel(captionHtml: string): {
	weekLabelRaw: string | null;
	dateRangeRaw: string | null;
} {
	const etitle = getXmlTagText(captionHtml, "etitle");
	const eloc = getXmlTagText(captionHtml, "eloc");

	if (etitle || eloc) {
		return {
			weekLabelRaw: etitle || null,
			dateRangeRaw: eloc || etitle || null,
		};
	}

	const plain = htmlToText(captionHtml);
	return {
		weekLabelRaw: plain || null,
		dateRangeRaw: plain || null,
	};
}

function parseExtractCaption(captionHtml: string): {
	source: string;
	tema: string;
} {
	const source = getXmlTagText(captionHtml, "eloc");
	const tema = getXmlTagText(captionHtml, "etitle");

	if (source || tema) {
		return { source, tema };
	}

	const plain = htmlToText(captionHtml);
	return {
		source: plain,
		tema: plain,
	};
}

function deriveAesKey(
	langIdx: number,
	symbol: string,
	year: number,
	issueTag: string | number,
): { key: Buffer; iv: Buffer } {
	let material = `${langIdx}${symbol}${year}`;
	const issueTagNumber =
		typeof issueTag === "string" ? Number(issueTag) : issueTag;

	if (Number.isFinite(issueTagNumber) && issueTagNumber !== 0) {
		material += String(issueTag);
	}

	const hash = createHash("sha256").update(material, "utf8").digest();
	const xored = Buffer.alloc(32);

	for (let index = 0; index < 32; index += 1) {
		const left = hash[index] ?? 0;
		const right = AES_XOR_CONST[index] ?? 0;
		xored[index] = left ^ right;
	}

	return {
		key: xored.subarray(0, 16),
		iv: xored.subarray(16, 32),
	};
}

function decryptAesContent(
	content: Buffer,
	key: Buffer,
	iv: Buffer,
): string | null {
	try {
		const decipher = createDecipheriv("aes-128-cbc", key, iv);
		const decrypted = Buffer.concat([
			decipher.update(content),
			decipher.final(),
		]);

		return inflateSync(decrypted).toString("utf8");
	} catch {
		return null;
	}
}

function inferLocaleFromMeps(language: unknown): ContentLocale {
	const locale =
		LOCALE_BY_MEPS[Number(language) as keyof typeof LOCALE_BY_MEPS];

	if (locale === "pt" || locale === "es") {
		return locale;
	}

	throw new Error(
		`Idioma não suportado no arquivo MWB (MEPS ${String(
			language,
		)}). Use uma apostila em português ou espanhol.`,
	);
}

function buildSymbol(publication: ManifestPub, pubRow: PubRow | null): string {
	const raw = normalizeWhitespace(
		publication.uniqueEnglishSymbol ??
			publication.symbol ??
			pubRow?.Symbol ??
			publication.undatedSymbol ??
			"mwb",
	);

	const issueNumber = Number(publication.issueNumber ?? pubRow?.IssueNumber);
	const year = Number(publication.year ?? pubRow?.Year);

	if (raw && Number.isInteger(issueNumber) && Number.isInteger(year)) {
		return `${raw}${String(year).slice(-2)}.${String(issueNumber).padStart(
			2,
			"0",
		)}`;
	}

	return raw || "mwb";
}

function inferMonth(
	publication: ManifestPub,
	pubRow: PubRow | null,
): number | null {
	const issueNumber = Number(publication.issueNumber ?? pubRow?.IssueNumber);

	if (Number.isInteger(issueNumber) && issueNumber >= 1 && issueNumber <= 12) {
		return issueNumber;
	}

	const issueTag = String(
		publication.issueTagNumber ?? pubRow?.IssueTagNumber ?? "",
	).replace(/\D/g, "");

	if (issueTag.length >= 6) {
		const month = Number(issueTag.slice(4, 6));
		if (Number.isInteger(month) && month >= 1 && month <= 12) {
			return month;
		}
	}

	return null;
}

function classifySection(
	name: string,
): "TREASURES" | "APPLY" | "LIVING" | null {
	const normalized = normalizeForMatch(name);

	if (
		normalized.includes("TESOROS") ||
		normalized.includes("TESOUROS") ||
		normalized.includes("JOYAS") ||
		normalized.includes("TREASURES")
	) {
		return "TREASURES";
	}

	if (
		normalized.includes("SEAMOS MEJORES") ||
		normalized.includes("FACAMOS MELHORES") ||
		normalized.includes("APPLY YOURSELF") ||
		normalized.includes("MEJORES MAESTROS") ||
		normalized.includes("MELHORES MESTRES")
	) {
		return "APPLY";
	}

	if (
		normalized.includes("NUESTRA VIDA") ||
		normalized.includes("NOSSA VIDA") ||
		normalized.includes("LIVING AS CHRISTIANS") ||
		normalized.includes("VIDA CRISTIANA") ||
		normalized.includes("VIDA CRISTA")
	) {
		return "LIVING";
	}

	return null;
}

function sectionDisplayName(
	code: "TREASURES" | "APPLY" | "LIVING" | null,
	rawName: string,
	locale: ContentLocale,
): string {
	if (code === "TREASURES") {
		return locale === "pt"
			? "Tesouros da Palavra de Deus"
			: "Tesoros de la Biblia";
	}

	if (code === "APPLY") {
		return locale === "pt"
			? "Faça seu melhor no ministério"
			: "Seamos mejores maestros";
	}

	if (code === "LIVING") {
		return locale === "pt" ? "Nossa Vida Cristã" : "Nuestra vida cristiana";
	}

	return rawName || (locale === "pt" ? "Seção" : "Sección");
}

function parseDurationMin(text: string): number | null {
	const match = text.match(/(\d{1,3})\s*mins?\.?/i);
	if (!match) return null;

	const duration = Number(match[1]);
	if (!Number.isInteger(duration) || duration < 0 || duration > 180) {
		return null;
	}

	return duration;
}

function extractModalidade(text: string): string | null {
	const rest = text.replace(/\(\s*\d+\s*mins?\.?\s*\)/gi, "").trim();
	const upper = normalizeForMatch(rest);

	for (const marker of FORMAT_MARKERS) {
		if (upper.startsWith(normalizeForMatch(marker))) {
			return marker;
		}
	}

	return null;
}

function isSongSource(source: string): boolean {
	return /canci[oó]n|c[aâ]ntico|song/i.test(source);
}

function headingMatchesSection(text: string): boolean {
	const normalized = normalizeForMatch(text);

	if (SECTION_HEADINGS.has(normalized)) return true;

	return (
		normalized.includes("TESOROS") ||
		normalized.includes("TESOUROS") ||
		normalized.includes("SEAMOS MEJORES") ||
		normalized.includes("FACAMOS MELHORES") ||
		normalized.includes("NUESTRA VIDA") ||
		normalized.includes("NOSSA VIDA")
	);
}

function parseActivityName(rawText: string): string {
	return normalizeWhitespace(
		rawText.replace(/\(\s*\d+\s*mins?\.?\s*\)/gi, "").replace(/\.$/, ""),
	);
}

function tableExists(db: SqlJsDatabase, tableName: string): boolean {
	const safeName = tableName.replace(/'/g, "''");
	const result = db.exec(
		`SELECT name FROM sqlite_master WHERE type = 'table' AND name = '${safeName}' LIMIT 1`,
	);

	return (result[0]?.values.length ?? 0) > 0;
}

function execAll<T extends Record<string, unknown>>(
	db: SqlJsDatabase,
	sql: string,
): T[] {
	const result = db.exec(sql);
	const first = result[0];

	if (!first) return [];

	return first.values.map((row) => {
		const mapped: Record<string, unknown> = {};

		first.columns.forEach((column, index) => {
			mapped[column] = row[index];
		});

		return mapped as T;
	});
}

function execOne<T extends Record<string, unknown>>(
	db: SqlJsDatabase,
	sql: string,
): T | null {
	return execAll<T>(db, sql)[0] ?? null;
}

function asUint8Array(value: unknown): Uint8Array | null {
	if (!value) return null;
	if (value instanceof Uint8Array) return value;
	if (value instanceof ArrayBuffer) return new Uint8Array(value);
	if (Buffer.isBuffer(value)) return new Uint8Array(value);
	return null;
}

function buildTimingAndModalityMaps(elements: HtmlElement[]): {
	timingMap: Map<number, number | null>;
	modalityMap: Map<number, string | null>;
} {
	const timingMap = new Map<number, number | null>();
	const modalityMap = new Map<number, string | null>();
	let lastTiming: number | null = null;

	for (const element of elements) {
		const pid = getPid(element);
		if (pid == null) continue;

		const duration = parseDurationMin(element.text);
		if (duration != null) {
			lastTiming = duration;
		}

		const modality = extractModalidade(element.text);
		if (modality) {
			modalityMap.set(pid, modality);
		}

		timingMap.set(pid, lastTiming);
	}

	return { timingMap, modalityMap };
}

function buildBoundaries(elements: HtmlElement[]): Boundary[] {
	const boundaries: Boundary[] = [];

	for (const element of elements) {
		const pid = getPid(element);

		if (element.tag === "h2" && headingMatchesSection(element.text)) {
			boundaries.push({
				tag: "section",
				name: element.text,
				pid: pid ?? 0,
			});
			continue;
		}

		if (element.tag !== "h3" || pid == null) continue;

		const className = getClass(element);
		const normalized = normalizeForMatch(element.text);

		if (className.includes("dc-icon--music")) continue;
		if (
			normalized.includes("PALABRAS DE CONCLUSION") ||
			normalized.includes("PALAVRAS DE CONCLUSAO")
		) {
			continue;
		}
		if (
			(normalized.includes("CANCION") || normalized.includes("CANTICO")) &&
			/\d{1,3}/.test(element.text)
		) {
			continue;
		}

		const name = parseActivityName(element.text);
		if (!name) continue;

		boundaries.push({
			tag: "activity",
			name,
			pid,
		});
	}

	return boundaries.sort((a, b) => a.pid - b.pid);
}

function getPartSourceAndTheme(
	docExtract: DocExtractRow,
	extracts: Map<number, ExtractRow>,
): { source: string; tema: string } {
	const extract = extracts.get(Number(docExtract.ExtractId));
	return parseExtractCaption(String(extract?.Caption ?? ""));
}

function pickSongs(weekSongs: SongRow[]): {
	opening: number | null;
	middle: number | null;
	closing: number | null;
} {
	const tracks = [...weekSongs]
		.sort(
			(a, b) =>
				Number(a.BeginParagraphOrdinal) - Number(b.BeginParagraphOrdinal),
		)
		.map((song) => Number(song.Track))
		.filter((track) => Number.isInteger(track) && track >= 1 && track <= 999);

	const first = tracks[0] ?? null;
	const second = tracks[1] ?? null;
	const last = tracks.length > 0 ? (tracks[tracks.length - 1] ?? null) : null;
	const middleIndex = Math.floor(tracks.length / 2);
	const middle = tracks.length >= 3 ? (tracks[middleIndex] ?? null) : null;

	if (tracks.length === 0) {
		return { opening: null, middle: null, closing: null };
	}

	if (tracks.length === 1) {
		return { opening: first, middle: null, closing: null };
	}

	if (tracks.length === 2) {
		return {
			opening: first,
			middle: null,
			closing: second,
		};
	}

	return {
		opening: first,
		middle,
		closing: last,
	};
}

function buildFallbackSections(
	locale: ContentLocale,
	weekExtracts: DocExtractRow[],
	extracts: Map<number, ExtractRow>,
): MwbSectionExtract[] {
	const parts = weekExtracts
		.map((docExtract, index) => {
			const { source, tema } = getPartSourceAndTheme(docExtract, extracts);

			if (isSongSource(source)) return null;

			const title = tema || source || `Parte ${index + 1}`;

			return {
				title,
				theme: tema || null,
				durationMin: null as number | null,
				modality: null as string | null,
				source: source || null,
				sortOrder: index,
			};
		})
		.filter(
			(
				part,
			): part is {
				title: string;
				theme: string | null;
				durationMin: number | null;
				modality: string | null;
				source: string | null;
				sortOrder: number;
			} => part !== null,
		);

	if (parts.length === 0) return [];

	return [
		{
			name: sectionDisplayName("TREASURES", "Seção", locale),
			code: "TREASURES",
			sortOrder: 0,
			parts,
		},
	];
}

function buildWeekSections(input: {
	locale: ContentLocale;
	html: string | null;
	weekExtracts: DocExtractRow[];
	extracts: Map<number, ExtractRow>;
}): MwbSectionExtract[] {
	const { locale, html, weekExtracts, extracts } = input;

	if (!html) {
		return buildFallbackSections(locale, weekExtracts, extracts);
	}

	const elements = parseHtmlElements(html);
	const { timingMap, modalityMap } = buildTimingAndModalityMaps(elements);
	const boundaries = buildBoundaries(elements);

	const extractsByPid = new Map<
		number,
		Array<{ source: string; tema: string }>
	>();

	for (const docExtract of weekExtracts) {
		const { source, tema } = getPartSourceAndTheme(docExtract, extracts);

		if (isSongSource(source)) continue;

		const pid = Number(docExtract.BeginParagraphOrdinal);
		const list = extractsByPid.get(pid) ?? [];
		list.push({ source, tema });
		extractsByPid.set(pid, list);
	}

	const sectionActivities: SectionActivities[] = [];
	let currentSection: SectionActivities | null = null;

	for (const boundary of boundaries) {
		if (boundary.tag === "section") {
			currentSection = {
				name: boundary.name,
				activities: [],
			};
			sectionActivities.push(currentSection);
			continue;
		}

		if (boundary.tag === "activity" && currentSection) {
			currentSection.activities.push({
				pid: boundary.pid,
				name: boundary.name,
			});
		}
	}

	if (sectionActivities.length === 0) {
		return buildFallbackSections(locale, weekExtracts, extracts);
	}

	const sections: MwbSectionExtract[] = [];

	for (
		let sectionIndex = 0;
		sectionIndex < sectionActivities.length;
		sectionIndex += 1
	) {
		const section = sectionActivities[sectionIndex];
		if (!section) continue;

		const code = classifySection(section.name);
		const parts: MwbSectionExtract["parts"] = [];

		for (
			let activityIndex = 0;
			activityIndex < section.activities.length;
			activityIndex += 1
		) {
			const activity = section.activities[activityIndex];
			if (!activity) continue;

			let nextPid = Number.POSITIVE_INFINITY;

			if (activityIndex + 1 < section.activities.length) {
				nextPid =
					section.activities[activityIndex + 1]?.pid ??
					Number.POSITIVE_INFINITY;
			} else if (sectionIndex + 1 < sectionActivities.length) {
				nextPid =
					sectionActivities[sectionIndex + 1]?.activities[0]?.pid ??
					Number.POSITIVE_INFINITY;
			}

			const activityExtracts: Array<{ source: string; tema: string }> = [];

			for (const [pid, values] of extractsByPid) {
				if (pid >= activity.pid && pid < nextPid) {
					activityExtracts.push(...values);
				}
			}

			const relevantPids = [...timingMap.keys()]
				.filter((pid) => pid >= activity.pid && pid < nextPid)
				.sort((a, b) => a - b);

			let durationMin: number | null = null;
			let modality: string | null = null;

			for (const pid of relevantPids) {
				if (durationMin == null) {
					durationMin = timingMap.get(pid) ?? null;
				}

				if (modality == null) {
					modality = modalityMap.get(pid) ?? null;
				}

				if (durationMin != null && modality != null) break;
			}

			const themes = [
				...new Set(
					activityExtracts.map((extract) => extract.tema).filter(Boolean),
				),
			];

			const sources = [
				...new Set(
					activityExtracts.map((extract) => extract.source).filter(Boolean),
				),
			];

			const title = activity.name || themes[0] || "Parte";
			const normalizedTitle = normalizeForMatch(title);

			const theme =
				GENERIC_PART_TYPES.has(title) || GENERIC_PART_TYPES.has(normalizedTitle)
					? (themes[0] ?? null)
					: /^DISCURSO$/i.test(normalizedTitle)
						? (themes[0] ?? null)
						: themes[0] && themes[0] !== title
							? themes[0]
							: null;

			parts.push({
				title,
				theme,
				durationMin,
				modality,
				source: sources.length > 0 ? sources.join("; ") : null,
				sortOrder: parts.length,
			});
		}

		if (parts.length === 0) continue;

		sections.push({
			name: sectionDisplayName(code, section.name, locale),
			code,
			sortOrder: sections.length,
			parts,
		});
	}

	return sections.length > 0
		? sections
		: buildFallbackSections(locale, weekExtracts, extracts);
}

function assertMwbPublication(
	publication: ManifestPub,
	pubRow: PubRow | null,
): void {
	const symbol = normalizeWhitespace(
		publication.uniqueEnglishSymbol ??
			publication.symbol ??
			pubRow?.Symbol ??
			publication.undatedSymbol ??
			"",
	).toLowerCase();

	const publicationType = String(
		publication.publicationType ?? "",
	).toLowerCase();

	const isMwb =
		symbol.startsWith("mwb") ||
		publicationType.includes("workbook") ||
		publicationType.includes("meeting");

	if (!isMwb) {
		throw new Error(
			`O arquivo enviado não parece ser uma apostila MWB (símbolo: ${
				symbol || "não identificado"
			}).`,
		);
	}
}

/** FirstDateOffset/LastDateOffset do MEPS: dias desde 1970-01-01, em UTC. */
export function mepsDayOffsetToIso(offset: unknown): string | null {
	const numericOffset = typeof offset === "number" ? offset : Number(offset);

	if (
		!Number.isFinite(numericOffset) ||
		numericOffset < 10_000 ||
		numericOffset > 100_000
	) {
		return null;
	}

	const date = new Date(Math.trunc(numericOffset) * 86_400_000);

	if (Number.isNaN(date.getTime())) return null;

	const year = date.getUTCFullYear();
	if (year < 2000 || year > 2100) return null;

	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

export async function extractMwbFromJwpubFile(
	jwpubPath: string,
	tempDir: string,
): Promise<MwbExtract> {
	const outerDir = join(tempDir, "outer");
	const innerDir = join(tempDir, "inner");

	await unzipToDir(jwpubPath, outerDir, MAX_EXPANDED_BYTES);

	const manifestRaw = await readFile(join(outerDir, "manifest.json"), "utf8");
	const manifest = JSON.parse(manifestRaw) as { publication?: ManifestPub };
	const publication = manifest.publication;

	if (!publication) {
		throw new Error("manifest.json sem dados da publicação.");
	}

	if (!publication.fileName) {
		throw new Error("manifest.json sem o caminho do banco da apostila.");
	}

	const locale = inferLocaleFromMeps(publication.language);

	await unzipToDir(join(outerDir, "contents"), innerDir, MAX_EXPANDED_BYTES);

	const databasePath = join(innerDir, publication.fileName);
	const databaseBuffer = await readFile(databasePath);

	const SQL = await initSqlJs();
	const database = new SQL.Database(new Uint8Array(databaseBuffer));

	try {
		if (!tableExists(database, "DatedText")) {
			throw new Error(
				"Tabela DatedText não encontrada. O arquivo não contém a estrutura esperada de uma apostila MWB.",
			);
		}

		const pubRow = execOne<PubRow>(
			database,
			`SELECT
				MepsLanguageIndex,
				Symbol,
				Year,
				IssueTagNumber,
				Title,
				IssueNumber
			FROM Publication
			LIMIT 1`,
		);

		assertMwbPublication(publication, pubRow);

		const issueProperty = tableExists(database, "PublicationIssueProperty")
			? execOne<IssuePropRow>(
					database,
					`SELECT Title, CoverTitle, Symbol
					FROM PublicationIssueProperty
					LIMIT 1`,
				)
			: null;

		const aesContext = pubRow
			? deriveAesKey(
					Number(pubRow.MepsLanguageIndex),
					String(pubRow.Symbol),
					Number(pubRow.Year),
					pubRow.IssueTagNumber ?? 0,
				)
			: null;

		const datedTexts = execAll<DatedTextRow>(
			database,
			`SELECT
				DatedTextId,
				DocumentId,
				Caption,
				FirstDateOffset,
				LastDateOffset,
				BeginParagraphOrdinal,
				EndParagraphOrdinal,
				Content
			FROM DatedText
			ORDER BY DatedTextId ASC`,
		);

		const extracts = new Map<number, ExtractRow>(
			tableExists(database, "Extract")
				? execAll<ExtractRow>(
						database,
						`SELECT
							ExtractId,
							COALESCE(Caption, '') AS Caption,
							Link
						FROM Extract`,
					).map((extract) => [Number(extract.ExtractId), extract])
				: [],
		);

		const docExtracts = tableExists(database, "DocumentExtract")
			? execAll<DocExtractRow>(
					database,
					`SELECT
						DocumentId,
						ExtractId,
						BeginParagraphOrdinal,
						EndParagraphOrdinal
					FROM DocumentExtract
					ORDER BY DocumentId ASC, BeginParagraphOrdinal ASC`,
				)
			: [];

		const docSongs =
			tableExists(database, "DocumentMultimedia") &&
			tableExists(database, "Multimedia")
				? execAll<SongRow>(
						database,
						`SELECT
							dm.DocumentId AS DocumentId,
							dm.BeginParagraphOrdinal AS BeginParagraphOrdinal,
							m.Track AS Track,
							m.KeySymbol AS KeySymbol,
							m.Label AS Label
						FROM DocumentMultimedia dm
						INNER JOIN Multimedia m
							ON m.MultimediaId = dm.MultimediaId
						WHERE m.KeySymbol IN ('sjjm', 'sjj', 'sjjy')
							AND m.Track IS NOT NULL
						ORDER BY dm.DocumentId ASC, dm.BeginParagraphOrdinal ASC`,
					)
				: [];

		const weeks: MwbWeekExtract[] = [];

		for (const datedText of datedTexts) {
			const weekStart = mepsDayOffsetToIso(datedText.FirstDateOffset);
			const weekEnd = mepsDayOffsetToIso(datedText.LastDateOffset);

			if (!weekStart || !weekEnd) continue;

			const caption = parseCaptionLabel(String(datedText.Caption ?? ""));

			const songs = pickSongs(
				docSongs.filter(
					(song) => Number(song.DocumentId) === Number(datedText.DocumentId),
				),
			);

			const weekDocExtracts = docExtracts.filter(
				(docExtract) =>
					Number(docExtract.DocumentId) === Number(datedText.DocumentId),
			);

			const content = asUint8Array(datedText.Content);

			const html =
				content && aesContext
					? decryptAesContent(
							Buffer.from(content),
							aesContext.key,
							aesContext.iv,
						)
					: null;

			let sections = buildWeekSections({
				locale,
				html,
				weekExtracts: weekDocExtracts,
				extracts,
			});

			if (sections.length === 0) {
				sections = [
					{
						name: sectionDisplayName("TREASURES", "Seção", locale),
						code: "TREASURES",
						sortOrder: 0,
						parts: [
							{
								title: caption.weekLabelRaw || `Semana de ${weekStart}`,
								theme: null,
								durationMin: null,
								modality: null,
								source: null,
								sortOrder: 0,
							},
						],
					},
				];
			}

			weeks.push({
				weekStart,
				weekEnd,
				weekLabelRaw: caption.weekLabelRaw,
				dateRangeRaw: caption.dateRangeRaw,
				openingSongNum: songs.opening,
				middleSongNum: songs.middle,
				closingSongNum: songs.closing,
				sortOrder: weeks.length,
				sections,
			});
		}

		if (weeks.length === 0) {
			throw new Error(
				"Nenhuma semana válida da apostila foi encontrada no arquivo .jwpub.",
			);
		}

		const title = normalizeWhitespace(
			issueProperty?.Title ??
				publication.issueProperties?.title ??
				publication.shortTitle ??
				publication.title ??
				pubRow?.Title ??
				"Apostila do meio de semana",
		);

		const coverTitle = normalizeWhitespace(
			issueProperty?.CoverTitle ??
				publication.issueProperties?.coverTitle ??
				publication.title ??
				"",
		);

		return sanitizeMwbExtract({
			locale,
			symbol: buildSymbol(publication, pubRow),
			title: title || "Apostila do meio de semana",
			coverTitle: coverTitle || null,
			year: Number(publication.year ?? pubRow?.Year) || null,
			month: inferMonth(publication, pubRow),
			notes: `Extraído de ${publication.fileName}: ${weeks.length} semana(s) encontrada(s).`,
			weeks,
		});
	} finally {
		database.close();
	}
}
