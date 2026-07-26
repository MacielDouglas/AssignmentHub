import type { ContentImportJobRepository } from "../../domain/repositories/content-import-job.repository";

type Deps = {
	jobs: ContentImportJobRepository;
};

export type DiscardMwbImportResult =
	| { ok: true }
	| { ok: false; error: string };

export async function discardMwbImportUseCase(
	deps: Deps,
	jobId: string,
): Promise<DiscardMwbImportResult> {
	const job = await deps.jobs.findById(jobId);

	if (job?.sourceType !== "MWB") {
		return {
			ok: false,
			error: "Importação da apostila não encontrada.",
		};
	}

	if (job.status === "COMMITTED") {
		return {
			ok: false,
			error: "Esta importação já foi confirmada e não pode ser descartada.",
		};
	}

	try {
		await deps.jobs.discard(jobId);

		return { ok: true };
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível descartar a importação.",
		};
	}
}
