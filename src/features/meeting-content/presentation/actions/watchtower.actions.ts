"use server";

import { revalidatePath } from "next/cache";

import {
	DeleteIdsSchema,
	JobIdSchema,
	LocaleOptionalSchema,
	WatchtowerExtractSchema,
} from "@/features/meeting-content/application/dto/watchtower-extract.dto";
import { requireMeetingContentManage } from "@/features/meeting-content/application/services/meeting-content-auth";
import { commitWatchtowerImportUseCase } from "@/features/meeting-content/application/use-cases/commit-watchtower-import";
import { createAndProcessWatchtowerImportUseCase } from "@/features/meeting-content/application/use-cases/create-and-process-watchtower-import";
import {
	deleteAllWatchtowerStudiesUseCase,
	deleteWatchtowerStudiesUseCase,
} from "@/features/meeting-content/application/use-cases/delete-watchtower-studies";
import { discardWatchtowerImportUseCase } from "@/features/meeting-content/application/use-cases/discard-watchtower-import";
import { updateWatchtowerImportDraftUseCase } from "@/features/meeting-content/application/use-cases/update-watchtower-import-draft";
import { createMeetingContentDeps } from "@/features/meeting-content/infrastructure/composition";

import {
  WatchtowerStudyUpdateSchema,
  type WatchtowerStudyUpdateInput,
} from "../../application/dto/watchtower-extract.dto";

import { updateWatchtowerStudyUseCase } from "../../application/use-cases/update-watchtower-study";

export type ActionResult<T = void> =
	| { ok: true; data: T }
	| { ok: false; error: string };

function revalidateMeetingContent(slug: string) {
	revalidatePath(`/org/${slug}/meeting-content`);
}

export async function createAndProcessWatchtowerImportAction(
	slug: string,
	formData: FormData,
): Promise<ActionResult<{ jobId: string }>> {
	try {
		await requireMeetingContentManage(slug);

		const fileEntry = formData.get("file");
		if (!(typeof File !== "undefined" && fileEntry instanceof File)) {
			return { ok: false, error: "Arquivo ausente." };
		}

		const deps = createMeetingContentDeps();
		const result = await createAndProcessWatchtowerImportUseCase(deps, {
			file: fileEntry,
		});

		if (!result.ok) return { ok: false, error: result.error };

		revalidateMeetingContent(slug);
		return { ok: true, data: { jobId: result.jobId } };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Erro ao importar",
		};
	}
}

export async function updateWatchtowerImportDraftAction(
	slug: string,
	jobId: string,
	payload: unknown,
): Promise<ActionResult> {
	try {
		await requireMeetingContentManage(slug);
		const id = JobIdSchema.parse({ jobId }).jobId;
		WatchtowerExtractSchema.parse(payload);

		const deps = createMeetingContentDeps();
		const result = await updateWatchtowerImportDraftUseCase(deps, id, payload);
		if (!result.ok) return { ok: false, error: result.error };

		revalidateMeetingContent(slug);
		return { ok: true, data: undefined };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Erro ao salvar rascunho",
		};
	}
}

export async function commitWatchtowerImportAction(
	slug: string,
	jobId: string,
): Promise<ActionResult<{ estudosSalvos: number }>> {
	try {
		await requireMeetingContentManage(slug);
		const id = JobIdSchema.parse({ jobId }).jobId;

		const deps = createMeetingContentDeps();
		const result = await commitWatchtowerImportUseCase(deps, id);
		if (!result.ok) return { ok: false, error: result.error };

		revalidateMeetingContent(slug);
		return { ok: true, data: { estudosSalvos: result.estudosSalvos } };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Erro ao confirmar",
		};
	}
}

export async function deleteWatchtowerStudiesAction(
	slug: string,
	ids: string[],
): Promise<ActionResult<{ count: number }>> {
	try {
		await requireMeetingContentManage(slug);
		const parsed = DeleteIdsSchema.parse({ ids });
		const deps = createMeetingContentDeps();
		const result = await deleteWatchtowerStudiesUseCase(deps, parsed.ids);
		revalidateMeetingContent(slug);
		return { ok: true, data: result };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Erro ao excluir",
		};
	}
}


export async function updateWatchtowerStudyAction(
  slug: string,
  payload: WatchtowerStudyUpdateInput,
): Promise<ActionResult> {
  try {
    await requireMeetingContentManage(slug);

    const input = WatchtowerStudyUpdateSchema.parse(payload);
    const dependencies = createMeetingContentDeps();

    const result = await updateWatchtowerStudyUseCase(dependencies, input);

    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
      };
    }

    revalidateMeetingContent(slug);

    return {
      ok: true,
      data: undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o estudo.",
    };
  }
}

export async function deleteAllWatchtowerStudiesAction(
	slug: string,
	locale?: "pt" | "es",
): Promise<ActionResult<{ count: number }>> {
	try {
		await requireMeetingContentManage(slug);
		const parsed = LocaleOptionalSchema.parse({ locale });
		const deps = createMeetingContentDeps();
		const result = await deleteAllWatchtowerStudiesUseCase(deps, parsed.locale);
		revalidateMeetingContent(slug);
		return { ok: true, data: result };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Erro ao excluir todos",
		};
	}
}

export async function discardWatchtowerImportAction(
	slug: string,
	jobId: string,
): Promise<ActionResult> {
	try {
		await requireMeetingContentManage(slug);
		const id = JobIdSchema.parse({ jobId }).jobId;
		const deps = createMeetingContentDeps();
		const result = await discardWatchtowerImportUseCase(deps, id);
		if (!result.ok) return { ok: false, error: result.error };
		revalidateMeetingContent(slug);
		return { ok: true, data: undefined };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Erro ao descartar",
		};
	}
}
