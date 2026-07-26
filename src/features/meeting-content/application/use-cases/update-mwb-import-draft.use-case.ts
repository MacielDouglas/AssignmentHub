import type { ContentImportJobRepository } from "../../domain/repositories/content-import-job.repository";
import { MwbExtractSchema, sanitizeMwbExtract } from "../dto/mwb-extract.dto";

type Deps = {
	jobs: ContentImportJobRepository;
};

export type UpdateMwbImportDraftResult =
	| { ok: true }
	| { ok: false; error: string };

export async function updateMwbImportDraftUseCase(
	deps: Deps,
	jobId: string,
	payload: unknown,
): Promise<UpdateMwbImportDraftResult> {
	const parsed = MwbExtractSchema.safeParse(payload);

	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message ?? "Dados da apostila inválidos.",
		};
	}

	const job = await deps.jobs.findById(jobId);

	if (job?.sourceType !== "MWB") {
		return {
			ok: false,
			error: "Importação da apostila não encontrada.",
		};
	}

	if (job.status !== "AWAITING_REVIEW" && job.status !== "FAILED") {
		return {
			ok: false,
			error: "Esta importação não está disponível para revisão.",
		};
	}

	const data = sanitizeMwbExtract(parsed.data);

	if (data.weeks.length === 0) {
		return {
			ok: false,
			error: "Inclua ao menos uma semana válida na apostila.",
		};
	}

	await deps.jobs.updateDraft(jobId, data);

	return { ok: true };
}
