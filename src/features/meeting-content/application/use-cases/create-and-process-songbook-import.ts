import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";
import type { ContentImportJobRepository } from "../../domain/repositories/content-import-job.repository";
import { sanitizeSongbookExtract } from "../dto/songbook-extract.dto";
import type { SongbookExtractor } from "../ports/songbook-extractor";

const ALLOWED_EXT = new Set([".jwpub"]);
const MAX_FILES = 1;
const MAX_BYTES = 80 * 1024 * 1024;

function safeFileName(name: string): string {
	return name.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 180);
}

function getExtension(name: string): string {
	const i = name.lastIndexOf(".");
	return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export type ProcessSongbookResult =
	| { ok: true; jobId: string }
	| { ok: false; error: string };

export async function createAndProcessSongbookImportUseCase(
	deps: {
		jobs: ContentImportJobRepository;
		songbook: SongbookExtractor;
	},
	input: { locale: ContentLocale; files: File[] },
): Promise<ProcessSongbookResult> {
	try {
		if (!input.files.length) {
			return {
				ok: false,
				error: "Envie o arquivo .jwpub do livro de cânticos.",
			};
		}
		if (input.files.length > MAX_FILES) {
			return { ok: false, error: "Envie apenas 1 arquivo por vez." };
		}

		const file = input.files.at(0);
		if (!file) {
			return {
				ok: false,
				error: "Envie o arquivo .jwpub do livro de cânticos.",
			};
		}

		const ext = getExtension(file.name);
		if (!ALLOWED_EXT.has(ext)) {
			return {
				ok: false,
				error: `Formato não suportado (${safeFileName(file.name)}). Use .jwpub do cântico (sjj).`,
			};
		}
		if (file.size > MAX_BYTES) {
			return { ok: false, error: "Arquivo muito grande (máx. 80MB)." };
		}

		const fileName = safeFileName(file.name);
		const job = await deps.jobs.createProcessing({
			sourceType: "SONGBOOK",
			locale: input.locale,
			fileNames: [fileName],
		});

		try {
			const buffer = await file.arrayBuffer();
			const extracted = await deps.songbook.extract(
				buffer,
				fileName,
				input.locale,
			);
			const clean = sanitizeSongbookExtract(extracted);

			if (clean.songs.length === 0) {
				await deps.jobs.markFailed(
					job.id,
					"Nenhum cântico encontrado. Confira se o arquivo é o livro de cânticos (sjj).",
				);
				return {
					ok: false,
					error:
						"Nenhum cântico encontrado no arquivo. Use o .jwpub do livro de cânticos.",
				};
			}

			await deps.jobs.markAwaitingReview({
				id: job.id,
				extractedJson: clean,
				notes:
					clean.notes ??
					`${clean.songs.length} cânticos extraídos de ${fileName}.`,
			});

			return { ok: true, jobId: job.id };
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Falha ao processar o .jwpub";
			await deps.jobs.markFailed(job.id, message);
			return { ok: false, error: message };
		}
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Erro inesperado",
		};
	}
}
