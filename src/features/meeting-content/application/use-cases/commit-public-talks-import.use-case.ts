import type { ContentImportJobRepository } from "../../domain/repositories/content-import-job.repository";
import type { PublicTalkRepository } from "../../domain/repositories/public-talk.repository";
import {
	PublicTalksExtractSchema,
	sanitizePublicTalksExtract,
} from "../dto/public-talks-extract.dto";

export async function commitPublicTalksImportUseCase(
	deps: {
		jobs: ContentImportJobRepository;
		publicTalks: PublicTalkRepository;
	},
	jobId: string,
): Promise<{ ok: true; upserted: number } | { ok: false; error: string }> {
	const job = await deps.jobs.findById(jobId);
	if (job?.sourceType !== "PUBLIC_TALKS") {
		return { ok: false, error: "Importação não encontrada." };
	}
	if (job.status !== "AWAITING_REVIEW") {
		return { ok: false, error: "Revise e confirme os dados antes de salvar." };
	}

	const parsed = PublicTalksExtractSchema.safeParse(job.extractedJson);
	if (!parsed.success) {
		return {
			ok: false,
			error: "JSON de revisão inválido. Salve o rascunho novamente.",
		};
	}

	const data = sanitizePublicTalksExtract(parsed.data);
	if (data.talks.length === 0) {
		return { ok: false, error: "Nenhum discurso para salvar." };
	}

	try {
		const upserted = await deps.publicTalks.upsertMany(
			data.talks.map((t) => ({
				locale: data.locale,
				number: t.number,
				title: t.title,
				notes: null,
			})),
		);

		await deps.jobs.markCommitted(jobId);
		return { ok: true, upserted };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Erro ao salvar discursos.",
		};
	}
}
