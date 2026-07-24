"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parseContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";
import { SongbookExtractSchema } from "../../application/dto/songbook-extract.dto";
import {
	DeleteIdsSchema,
	JobIdSchema,
	LocaleOptionalSchema,
} from "../../application/dto/watchtower-extract.dto";
import { requireMeetingContentManage } from "../../application/services/meeting-content-auth";
import { commitSongbookImportUseCase } from "../../application/use-cases/commit-songbook-import";
import { createAndProcessSongbookImportUseCase } from "../../application/use-cases/create-and-process-songbook-import";
import { createSongUseCase } from "../../application/use-cases/create-song";
import {
	deleteAllSongsUseCase,
	deleteSongsUseCase,
} from "../../application/use-cases/delete-songs";
import { updateSongUseCase } from "../../application/use-cases/update-song";
import { updateSongbookImportDraftUseCase } from "../../application/use-cases/update-songbook-import-draft";
import { createMeetingContentDeps } from "../../infrastructure/composition";

export type ActionResult<T = void> =
	| { ok: true; data: T }
	| { ok: false; error: string };

function revalidateSongs(slug: string) {
	revalidatePath(`/org/${slug}/meeting-content`, "layout");
	revalidatePath(`/org/${slug}/meeting-content/canticos`);
}

export async function createAndProcessSongbookImportAction(
	slug: string,
	formData: FormData,
): Promise<ActionResult<{ jobId: string }>> {
	try {
		await requireMeetingContentManage(slug);
		const locale = parseContentLocale(formData.get("locale"));
		const files = formData
			.getAll("files")
			.filter(
				(f): f is File => typeof File !== "undefined" && f instanceof File,
			);

		const deps = createMeetingContentDeps();
		const result = await createAndProcessSongbookImportUseCase(deps, {
			locale,
			files,
		});

		if (!result.ok) return { ok: false, error: result.error };

		revalidateSongs(slug);
		return { ok: true, data: { jobId: result.jobId } };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Erro ao importar cânticos",
		};
	}
}

export async function updateSongbookImportDraftAction(
	slug: string,
	jobId: string,
	payload: unknown,
): Promise<ActionResult> {
	try {
		await requireMeetingContentManage(slug);
		const id = JobIdSchema.parse({ jobId }).jobId;
		SongbookExtractSchema.parse(payload);

		const deps = createMeetingContentDeps();
		const result = await updateSongbookImportDraftUseCase(deps, id, payload);
		if (!result.ok) return { ok: false, error: result.error };

		revalidateSongs(slug);
		return { ok: true, data: undefined };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Erro ao salvar rascunho",
		};
	}
}

export async function commitSongbookImportAction(
	slug: string,
	jobId: string,
): Promise<ActionResult<{ upserted: number }>> {
	try {
		await requireMeetingContentManage(slug);
		const id = JobIdSchema.parse({ jobId }).jobId;
		const deps = createMeetingContentDeps();
		const result = await commitSongbookImportUseCase(deps, id);
		if (!result.ok) return { ok: false, error: result.error };

		revalidateSongs(slug);
		return { ok: true, data: { upserted: result.upserted } };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Erro ao confirmar",
		};
	}
}

export async function deleteSongsAction(
	slug: string,
	ids: string[],
): Promise<ActionResult<{ count: number }>> {
	try {
		await requireMeetingContentManage(slug);
		const parsed = DeleteIdsSchema.parse({ ids });
		const deps = createMeetingContentDeps();
		const count = await deleteSongsUseCase(deps, parsed.ids);
		revalidateSongs(slug);
		return { ok: true, data: { count } };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Erro ao excluir",
		};
	}
}

export async function deleteAllSongsAction(
	slug: string,
	locale?: "pt" | "es",
): Promise<ActionResult<{ count: number }>> {
	try {
		await requireMeetingContentManage(slug);
		const parsed = LocaleOptionalSchema.parse({ locale });
		const deps = createMeetingContentDeps();
		const count = await deleteAllSongsUseCase(deps, parsed.locale);
		revalidateSongs(slug);
		return { ok: true, data: { count } };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Erro ao excluir todos",
		};
	}
}

const SongMutationSchema = z.object({
	id: z.string().uuid().optional(),
	number: z.number().int().min(1).max(999),
	title: z.string().trim().min(1).max(300),
	locale: z.enum(["pt", "es"]),
});

export async function createSongAction(
	slug: string,
	payload: unknown,
): Promise<ActionResult> {
	try {
		await requireMeetingContentManage(slug);

		const input = SongMutationSchema.omit({ id: true }).parse(payload);
		const deps = createMeetingContentDeps();
		const result = await createSongUseCase(deps, input);

		if (!result.ok) {
			return { ok: false, error: result.error };
		}

		revalidateSongs(slug);
		return { ok: true, data: undefined };
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível adicionar o cântico.",
		};
	}
}

export async function updateSongAction(
	slug: string,
	payload: unknown,
): Promise<ActionResult> {
	try {
		await requireMeetingContentManage(slug);

		const input = SongMutationSchema.extend({
			id: z.string().uuid(),
		}).parse(payload);

		const deps = createMeetingContentDeps();
		const result = await updateSongUseCase(deps, input);

		if (!result.ok) {
			return { ok: false, error: result.error };
		}

		revalidateSongs(slug);
		return { ok: true, data: undefined };
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível atualizar o cântico.",
		};
	}
}
