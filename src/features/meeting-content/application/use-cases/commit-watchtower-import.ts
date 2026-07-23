import type { ContentImportJobRepository } from "../../domain/repositories/content-import-job.repository";
import type { WatchtowerStudyRepository } from "../../domain/repositories/watchtower-study.repository";
import { isoToUtcDate } from "../../domain/values-objects/study-week";
import { WatchtowerExtractSchema } from "../dto/watchtower-extract.dto";

export async function commitWatchtowerImportUseCase(
	deps: {
		jobs: ContentImportJobRepository;
		studies: WatchtowerStudyRepository;
	},
	jobId: string,
): Promise<{ ok: true; estudosSalvos: number } | { ok: false; error: string }> {
	const job = await deps.jobs.findById(jobId);

	if (job?.sourceType !== "WATCHTOWER") {
		return { ok: false, error: "Importação não encontrada." };
	}
	if (job.status !== "AWAITING_REVIEW") {
		return { ok: false, error: "Revise e confirme os dados antes de salvar." };
	}

	const parsed = WatchtowerExtractSchema.safeParse(job.extractedJson);
	if (!parsed.success) {
		return {
			ok: false,
			error: "JSON de revisão inválido. Salve o rascunho novamente.",
		};
	}

	const { locale, issueCode, articles } = parsed.data;
	let estudosSalvos = 0;

	try {
		for (const article of articles) {
			if (article.openingSong == null || article.closingSong == null) {
				return {
					ok: false,
					error: `Artigo "${article.title}" precisa de cânticos válidos.`,
				};
			}
			if (!article.weekStart || !article.weekEnd) {
				return {
					ok: false,
					error: `Artigo "${article.title}" precisa de data de início e fim.`,
				};
			}

			const weekStart = isoToUtcDate(article.weekStart);
			const weekEnd = isoToUtcDate(article.weekEnd);

			const [openingSongId, closingSongId] = await Promise.all([
				deps.studies.findSongId(article.openingSong, locale),
				deps.studies.findSongId(article.closingSong, locale),
			]);

			await deps.studies.upsertByWeek({
				locale,
				weekStart,
				weekEnd,
				weekLabelRaw: article.weekLabelRaw || null,
				title: article.title,
				openingSongNum: article.openingSong,
				closingSongNum: article.closingSong,
				highlightColor: article.highlightColor,
				issueCode,
				openingSongId,
				closingSongId,
			});
			estudosSalvos += 1;
		}

		await deps.jobs.markCommitted(jobId);
		return { ok: true, estudosSalvos };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Erro ao salvar estudos",
		};
	}
}
