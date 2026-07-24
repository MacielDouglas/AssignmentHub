import type { ContentImportJobRepository } from "../../domain/repositories/content-import-job.repository";
import type { SongRepository } from "../../domain/repositories/song.repository";
import {
	SongbookExtractCommitSchema,
	sanitizeSongbookExtract,
} from "../dto/songbook-extract.dto";

export async function commitSongbookImportUseCase(
	deps: {
		jobs: ContentImportJobRepository;
		songs: SongRepository;
	},
	jobId: string,
): Promise<{ ok: true; upserted: number } | { ok: false; error: string }> {
	const job = await deps.jobs.findById(jobId);
	if (job?.sourceType !== "SONGBOOK") {
		return { ok: false, error: "Importação não encontrada." };
	}
	if (job.status !== "AWAITING_REVIEW") {
		return { ok: false, error: "Revise e confirme os dados antes de salvar." };
	}

	const parsed = SongbookExtractCommitSchema.safeParse(job.extractedJson);
	if (!parsed.success) {
		return {
			ok: false,
			error: "JSON de revisão inválido. Salve o rascunho novamente.",
		};
	}

	const data = sanitizeSongbookExtract(parsed.data);
	if (data.songs.length === 0) {
		return { ok: false, error: "Inclua ao menos 1 cântico válido." };
	}

	try {
		const upserted = await deps.songs.upsertMany(
			data.songs.map((s) => ({
				number: s.number,
				title: s.title,
				locale: data.locale,
			})),
		);
		await deps.jobs.markCommitted(jobId);
		return { ok: true, upserted };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Erro ao salvar cânticos",
		};
	}
}
