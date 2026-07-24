import type { ContentImportJobRepository } from "../../domain/repositories/content-import-job.repository";

export async function discardWatchtowerImportUseCase(
	deps: { jobs: ContentImportJobRepository },
	jobId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
	const job = await deps.jobs.findById(jobId);
	if (job?.sourceType !== "WATCHTOWER") {
		return { ok: false, error: "Importação não encontrada." };
	}
	if (job.status === "COMMITTED") {
		return { ok: false, error: "Importação já foi salva no catálogo." };
	}

	try {
		await deps.jobs.discard(jobId);
		return { ok: true };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Erro ao descartar",
		};
	}
}
