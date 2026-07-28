import type { ContentImportJobRepository } from "../../domain/repositories/content-import-job.repository";

type Deps = {
	jobs: ContentImportJobRepository;
};

export type DiscardSongbookImportResult =
	| { ok: true }
	| { ok: false; error: string };

export async function discardSongbookImportUseCase(
	deps: Deps,
	jobId: string,
): Promise<DiscardSongbookImportResult> {
	const job = await deps.jobs.findById(jobId);

	if (job?.sourceType !== "SONGBOOK") {
		return {
			ok: false,
			error: "Importação de cânticos não encontrada.",
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
