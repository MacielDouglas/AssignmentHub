import type { ContentImportJobRepository } from "../../domain/repositories/content-import-job.repository";
import type MwbRepository from "../../domain/repositories/mwb.repository";
import {
	MwbExtractCommitSchema,
	sanitizeMwbExtract,
} from "../dto/mwb-extract.dto";

type Deps = {
	jobs: ContentImportJobRepository;
	mwbRepository: MwbRepository;
};

export type CommitMwbImportResult =
	| {
			ok: true;
			issueId: string;
			weeksUpserted: number;
			sectionsCreated: number;
			partsCreated: number;
	  }
	| {
			ok: false;
			error: string;
	  };

export async function commitMwbImportUseCase(
	deps: Deps,
	jobId: string,
): Promise<CommitMwbImportResult> {
	const job = await deps.jobs.findById(jobId);

	if (job?.sourceType !== "MWB") {
		return {
			ok: false,
			error: "Importação da apostila não encontrada.",
		};
	}

	if (job.status !== "AWAITING_REVIEW") {
		return {
			ok: false,
			error: "Revise e confirme os dados antes de salvar.",
		};
	}

	const parsed = MwbExtractCommitSchema.safeParse(job.extractedJson);

	if (!parsed.success) {
		return {
			ok: false,
			error:
				"Os dados revisados da apostila são inválidos. Salve o rascunho novamente.",
		};
	}

	const data = sanitizeMwbExtract(parsed.data);

	if (data.weeks.length === 0) {
		return {
			ok: false,
			error: "Inclua ao menos uma semana válida antes de confirmar.",
		};
	}

	try {
		const result = await deps.mwbRepository.commitExtract(data);

		await deps.jobs.markCommitted(jobId);

		return {
			ok: true,
			issueId: result.issueId,
			weeksUpserted: result.weeksUpserted,
			sectionsCreated: result.sectionsCreated,
			partsCreated: result.partsCreated,
		};
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível salvar a apostila.",
		};
	}
}
