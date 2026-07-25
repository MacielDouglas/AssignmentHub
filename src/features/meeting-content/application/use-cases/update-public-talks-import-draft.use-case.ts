import type { ContentImportJobRepository } from "../../domain/repositories/content-import-job.repository";
import {
	PublicTalksExtractSchema,
	sanitizePublicTalksExtract,
} from "../dto/public-talks-extract.dto";

export async function updatePublicTalksImportDraftUseCase(
	deps: { jobs: ContentImportJobRepository },
	jobId: string,
	payload: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
	const parsed = PublicTalksExtractSchema.safeParse(payload);
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
		};
	}

	const job = await deps.jobs.findById(jobId);

	if (job?.sourceType !== "PUBLIC_TALKS") {
		return { ok: false, error: "Importação não encontrada." };
	}

	if (job.status !== "AWAITING_REVIEW" && job.status !== "FAILED") {
		return { ok: false, error: "Esta importação não está em revisão." };
	}

	const data = sanitizePublicTalksExtract(parsed.data);
	await deps.jobs.updateDraft(jobId, data);
	return { ok: true };
}
