import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";
import type { ContentImportJobRepository } from "../../domain/repositories/content-import-job.repository";
import { sanitizeMwbExtract } from "../dto/mwb-extract.dto";
import type MwbExtractor from "../ports/mwb-extractor";

const ALLOWED_EXT = new Set([".jwpub"]);
const MAX_FILES = 1;
const MAX_BYTES = 80 * 1024 * 1024;

function safeFileName(name: string): string {
	return name.replace(/[^\w.-]+/g, "_").slice(0, 180);
}

function getExtension(name: string): string {
	const index = name.lastIndexOf(".");
	return index >= 0 ? name.slice(index).toLowerCase() : "";
}

export type ProcessMwbImportResult =
	| { ok: true; jobId: string }
	| { ok: false; error: string };

type Deps = {
	jobs: ContentImportJobRepository;
	mwb: MwbExtractor;
};

type Input = {
	locale: ContentLocale;
	files: File[];
};

export async function createAndProcessMwbImportUseCase(
	deps: Deps,
	input: Input,
): Promise<ProcessMwbImportResult> {
	try {
		if (input.files.length === 0) {
			return {
				ok: false,
				error: "Envie o arquivo .jwpub da apostila MWB.",
			};
		}

		if (input.files.length > MAX_FILES) {
			return {
				ok: false,
				error: "Envie apenas 1 arquivo da apostila por vez.",
			};
		}

		const file = input.files[0];
		if (!file) {
			return {
				ok: false,
				error: "Arquivo da apostila não encontrado.",
			};
		}

		const ext = getExtension(file.name);
		if (!ALLOWED_EXT.has(ext)) {
			return {
				ok: false,
				error: `Formato não suportado: ${safeFileName(file.name)}. Use um arquivo .jwpub da apostila.`,
			};
		}

		if (file.size <= 0 || file.size > MAX_BYTES) {
			return {
				ok: false,
				error: "Arquivo inválido ou muito grande. Máximo 80MB.",
			};
		}

		const fileName = safeFileName(file.name);

		const job = await deps.jobs.createProcessing({
			sourceType: "MWB",
			locale: input.locale,
			fileNames: [fileName],
		});

		try {
			const buffer = await file.arrayBuffer();
			const extracted = await deps.mwb.extract({
				buffer,
				fileName,
				locale: input.locale,
			});

			const clean = sanitizeMwbExtract(extracted);

			if (clean.weeks.length === 0) {
				await deps.jobs.markFailed(
					job.id,
					"Nenhuma semana válida encontrada no arquivo da apostila.",
				);

				return {
					ok: false,
					error: "Nenhuma semana válida foi encontrada no arquivo .jwpub.",
				};
			}

			await deps.jobs.markAwaitingReview({
				id: job.id,
				extractedJson: clean,
				notes:
					clean.notes ??
					`${clean.weeks.length} semanas extraídas de ${fileName}.`,
			});

			return {
				ok: true,
				jobId: job.id,
			};
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Falha ao processar o arquivo .jwpub da apostila.";

			await deps.jobs.markFailed(job.id, message);

			return {
				ok: false,
				error: message,
			};
		}
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error.message : "Erro inesperado.",
		};
	}
}
