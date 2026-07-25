// import type { ContentImportJobRepository } from "../../domain/repositories/content-import-job.repository";
// import { extractPublicTalksFromJwpubFile } from "../../infrastructure/jwpub/extract-public-talks";

// import {
// 	PublicTalksExtractSchema,
// 	sanitizePublicTalksExtract,
// } from "../dto/public-talks-extract.dto";

// const MAX_BYTES = 40 * 1024 * 1024;

// function safeFileName(name: string) {
// 	return name.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 180);
// }

// export async function createAndProcessPublicTalksImportUseCase(
// 	deps: { jobs: ContentImportJobRepository },
// 	input: { file: File },
// ): Promise<{ ok: true; jobId: string } | { ok: false; error: string }> {
// 	try {
// 		const file = input.file;
// 		const name = safeFileName(file.name || "s-34.jwpub");

// 		if (!name.toLowerCase().endsWith(".jwpub")) {
// 			return { ok: false, error: "Use um arquivo .jwpub (S-34)." };
// 		}
// 		if (file.size <= 0 || file.size > MAX_BYTES) {
// 			return { ok: false, error: "Tamanho de arquivo inválido (máx. 40MB)." };
// 		}

// 		const job = await deps.jobs.createProcessing({
// 			sourceType: "PUBLIC_TALKS",
// 			locale: "pt", // atualizado após extrair
// 			fileNames: [name],
// 		});

// 		try {
// 			const buffer = Buffer.from(await file.arrayBuffer());
// 			const extracted = await extractPublicTalksFromJwpubFile(buffer, name);
// 			const data = sanitizePublicTalksExtract(
// 				PublicTalksExtractSchema.parse(extracted),
// 			);

// 			if (data.talks.length === 0) {
// 				await deps.jobs.markFailed(
// 					job.id,
// 					"Nenhum discurso encontrado no S-34.",
// 				);
// 				return { ok: false, error: "Nenhum discurso encontrado no arquivo." };
// 			}

// 			await deps.jobs.markAwaitingReview({
// 				id: job.id,
// 				locale: data.locale,
// 				extractedJson: data,
// 				notes: data.notes ?? `Origem: ${name}`,
// 			});

// 			return { ok: true, jobId: job.id };
// 		} catch (err) {
// 			const msg =
// 				err instanceof Error ? err.message : "Falha ao processar .jwpub.";
// 			await deps.jobs.markFailed(job.id, msg);
// 			return { ok: false, error: msg };
// 		}
// 	} catch (e) {
// 		return {
// 			ok: false,
// 			error: e instanceof Error ? e.message : "Erro ao importar.",
// 		};
// 	}
// }

import { randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { ContentImportJobRepository } from "../../domain/repositories/content-import-job.repository";
import { MAX_UPLOAD_BYTES } from "../../infrastructure/jwpub/constants";
import { extractPublicTalksFromJwpubFile } from "../../infrastructure/jwpub/extract-public-talks";
import {
	type PublicTalksExtract,
	sanitizePublicTalksExtract,
} from "../dto/public-talks-extract.dto";

function safeFileName(name: string) {
	return name.replace(/[^\w.-]+/g, "_").slice(0, 180);
}

export async function createAndProcessPublicTalksImportUseCase(
	deps: { jobs: ContentImportJobRepository },
	input: { file: File },
): Promise<{ ok: true; jobId: string } | { ok: false; error: string }> {
	let tempDir: string | null = null;
	let jobId: string | null = null;

	try {
		const name = input.file.name.toLowerCase();
		if (!name.endsWith(".jwpub")) {
			return { ok: false, error: "Use o arquivo .jwpub do S-34." };
		}
		if (input.file.size <= 0 || input.file.size > MAX_UPLOAD_BYTES) {
			return { ok: false, error: "Tamanho de arquivo inválido." };
		}

		const buf = Buffer.from(await input.file.arrayBuffer());
		if (buf[0] !== 0x50 || buf[1] !== 0x4b) {
			return { ok: false, error: "Arquivo ZIP/JWPUB inválido." };
		}

		const fileName = safeFileName(input.file.name);

		const job = await deps.jobs.createProcessing({
			sourceType: "PUBLIC_TALKS",
			locale: "pt",
			fileNames: [fileName],
		});
		jobId = job.id;

		tempDir = await mkdtemp(join(tmpdir(), "jwpub-talks-"));
		const path = join(tempDir, `${randomUUID()}.jwpub`);
		await writeFile(path, buf);

		const extracted = await extractPublicTalksFromJwpubFile(path, tempDir);
		const payload: PublicTalksExtract = sanitizePublicTalksExtract(extracted);

		if (payload.talks.length === 0) {
			await deps.jobs.markFailed(job.id, "Nenhum discurso válido extraído.");
			return { ok: false, error: "Nenhum discurso válido no arquivo." };
		}

		await deps.jobs.markAwaitingReview({
			id: job.id,
			extractedJson: payload,
			notes: payload.notes ?? null,
		});

		// se o repositório permitir atualizar locale após extração:
		// await deps.jobs.updateLocale?.(job.id, payload.locale)

		return { ok: true, jobId: job.id };
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Falha ao processar o JWPUB.";
		if (jobId) {
			try {
				await deps.jobs.markFailed(jobId, message);
			} catch {
				/* ignore */
			}
		}
		return { ok: false, error: message };
	} finally {
		if (tempDir) {
			try {
				await rm(tempDir, { recursive: true, force: true });
			} catch {
				/* Windows EBUSY */
			}
		}
	}
}
