import type { ContentImportJobRepository } from "../../domain/repositories/content-import-job.repository";

export async function discardPublicTalksImportUseCase(
	deps: { jobs: ContentImportJobRepository },
	jobId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
	const job = await deps.jobs.findById(jobId);
	if (job?.sourceType !== "PUBLIC_TALKS") {
		return { ok: false, error: "Importação não encontrada." };
	}
	if (
		job.status !== "AWAITING_REVIEW" &&
		job.status !== "FAILED" &&
		job.status !== "PENDING" &&
		job.status !== "PROCESSING"
	) {
		return { ok: false, error: "Esta importação não pode ser descartada." };
	}

	await deps.jobs.discard(jobId); // ou deleteById — use o mesmo método dos cânticos
	return { ok: true };
}
