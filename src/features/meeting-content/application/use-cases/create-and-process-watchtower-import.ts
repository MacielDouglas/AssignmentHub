import { randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
	sanitizeWatchtowerExtract,
	WatchtowerExtractSchema,
} from "@/features/meeting-content/application/dto/watchtower-extract.dto";
import type { ContentImportJobRepository } from "@/features/meeting-content/domain/repositories/content-import-job.repository";
import { MAX_UPLOAD_BYTES } from "@/features/meeting-content/infrastructure/jwpub/constants";
import { extractWatchtowerFromJwpubFile } from "@/features/meeting-content/infrastructure/jwpub/extract-watchtower";
import { db } from "@/lib/db";

function safeFileName(name: string): string {
	return name.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 180);
}

function getExtension(name: string): string {
	const i = name.lastIndexOf(".");
	return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export type ProcessImportResult =
	| { ok: true; jobId: string }
	| { ok: false; error: string };

export async function createAndProcessWatchtowerImportUseCase(
	deps: { jobs: ContentImportJobRepository },
	input: { file: File },
): Promise<ProcessImportResult> {
	let tempDir: string | null = null;
	let jobId: string | null = null;

	try {
		if (!input.file) {
			return { ok: false, error: "Envie um arquivo .jwpub." };
		}

		const ext = getExtension(input.file.name);
		if (ext !== ".jwpub") {
			return {
				ok: false,
				error: `Formato não suportado (${safeFileName(input.file.name)}). Use .jwpub da JW Library.`,
			};
		}

		if (input.file.size <= 0 || input.file.size > MAX_UPLOAD_BYTES) {
			return {
				ok: false,
				error: `Tamanho inválido (máx. ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)} MB).`,
			};
		}

		const buf = Buffer.from(await input.file.arrayBuffer());
		if (buf[0] !== 0x50 || buf[1] !== 0x4b) {
			return { ok: false, error: "Arquivo ZIP/JWPUB inválido." };
		}

		// locale temporário; será sobrescrito com o locale real do manifest
		const job = await deps.jobs.createProcessing({
			sourceType: "WATCHTOWER",
			locale: "es",
			fileNames: [safeFileName(input.file.name)],
		});
		jobId = job.id;

		tempDir = await mkdtemp(join(tmpdir(), "jwpub-ah-"));
		const path = join(tempDir, `${randomUUID()}.jwpub`);
		await writeFile(path, buf);

		const extracted = await extractWatchtowerFromJwpubFile(path, tempDir);
		const sanitized = sanitizeWatchtowerExtract(extracted);
		const parsed = WatchtowerExtractSchema.safeParse(sanitized);

		if (!parsed.success || parsed.data.articles.length === 0) {
			const msg = !parsed.success
				? (parsed.error.issues[0]?.message ?? "Dados extraídos inválidos")
				: "Nenhum estudo válido encontrado.";
			await deps.jobs.markFailed(job.id, msg);
			return { ok: false, error: msg };
		}

		await deps.jobs.markAwaitingReview({
			id: job.id,
			extractedJson: parsed.data,
			notes: parsed.data.notes ?? null,
		});

		await db.contentImportJob.update({
			where: { id: job.id },
			data: { locale: parsed.data.locale },
		});

		return { ok: true, jobId: job.id };
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Falha ao processar o JWPUB";
		if (jobId) {
			try {
				await deps.jobs.markFailed(jobId, message);
			} catch {
				// ignore
			}
		}
		return { ok: false, error: message };
	} finally {
		if (tempDir) {
			try {
				await rm(tempDir, { recursive: true, force: true });
			} catch {
				// Windows EBUSY
			}
		}
	}
}
