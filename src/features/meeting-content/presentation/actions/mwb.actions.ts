"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
	JobIdSchema,
	MwbExtractSchema,
	MwbIssueUpdateSchema,
} from "../../application/dto/mwb-extract.dto";
import { requireMeetingContentManage } from "../../application/services/meeting-content-auth";
import { commitMwbImportUseCase } from "../../application/use-cases/commit-mwb-import.use-case";
import { createAndProcessMwbImportUseCase } from "../../application/use-cases/create-and-process-mwb-import.use-case";
import {
	deleteAllMwbIssuesUseCase,
	deleteMwbIssuesUseCase,
} from "../../application/use-cases/delete-mwb-issues.use-case";
import { discardMwbImportUseCase } from "../../application/use-cases/discard-mwb-import.use-case";
import { updateMwbImportDraftUseCase } from "../../application/use-cases/update-mwb-import-draft.use-case";
import { updateMwbIssueUseCase } from "../../application/use-cases/update-mwb-issue.use-case";
import { parseContentLocale } from "../../domain/values-objects/content-locale";
import { createMeetingContentDeps } from "../../infrastructure/composition";

export type ActionResult<T = void> =
	| { ok: true; data: T }
	| { ok: false; error: string };

const DeleteIdsSchema = z.object({
	ids: z.array(z.string().min(1)).min(1),
});

const LocaleRequiredSchema = z.object({
	locale: z.enum(["pt", "es"]),
});

function revalidateMwb(slug: string): void {
	revalidatePath(`/org/${slug}/meeting-content`, "layout");
	revalidatePath(`/org/${slug}/meeting-content/apostila`);
}

export async function createAndProcessMwbImportAction(
	slug: string,
	formData: FormData,
): Promise<ActionResult<{ jobId: string }>> {
	try {
		await requireMeetingContentManage(slug);

		const locale = parseContentLocale(formData.get("locale"));

		const files = formData
			.getAll("files")
			.filter(
				(item): item is File =>
					typeof File !== "undefined" && item instanceof File,
			);

		const deps = createMeetingContentDeps();

		const result = await createAndProcessMwbImportUseCase(deps, {
			locale,
			files,
		});

		if (!result.ok) {
			return {
				ok: false,
				error: result.error,
			};
		}

		revalidateMwb(slug);

		return {
			ok: true,
			data: {
				jobId: result.jobId,
			},
		};
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível importar a apostila.",
		};
	}
}

export async function updateMwbImportDraftAction(
	slug: string,
	jobId: string,
	payload: unknown,
): Promise<ActionResult> {
	try {
		await requireMeetingContentManage(slug);

		const id = JobIdSchema.parse({ jobId }).jobId;
		const draft = MwbExtractSchema.parse(payload);

		const deps = createMeetingContentDeps();
		const result = await updateMwbImportDraftUseCase(deps, id, draft);

		if (!result.ok) {
			return {
				ok: false,
				error: result.error,
			};
		}

		revalidateMwb(slug);

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
					: "Não foi possível salvar o rascunho da apostila.",
		};
	}
}

export async function commitMwbImportAction(
	slug: string,
	jobId: string,
): Promise<
	ActionResult<{
		issueId: string;
		weeksUpserted: number;
		sectionsCreated: number;
		partsCreated: number;
	}>
> {
	try {
		await requireMeetingContentManage(slug);

		const id = JobIdSchema.parse({ jobId }).jobId;

		const deps = createMeetingContentDeps();
		const result = await commitMwbImportUseCase(deps, id);

		if (!result.ok) {
			return {
				ok: false,
				error: result.error,
			};
		}

		revalidateMwb(slug);

		return {
			ok: true,
			data: {
				issueId: result.issueId,
				weeksUpserted: result.weeksUpserted,
				sectionsCreated: result.sectionsCreated,
				partsCreated: result.partsCreated,
			},
		};
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível confirmar a apostila.",
		};
	}
}

export async function discardMwbImportAction(
	slug: string,
	jobId: string,
): Promise<ActionResult> {
	try {
		await requireMeetingContentManage(slug);

		const id = JobIdSchema.parse({ jobId }).jobId;

		const deps = createMeetingContentDeps();
		const result = await discardMwbImportUseCase(deps, id);

		if (!result.ok) {
			return {
				ok: false,
				error: result.error,
			};
		}

		revalidateMwb(slug);

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
					: "Não foi possível descartar a importação.",
		};
	}
}

export async function deleteMwbIssuesAction(
	slug: string,
	ids: string[],
): Promise<ActionResult<{ count: number }>> {
	try {
		await requireMeetingContentManage(slug);

		const parsed = DeleteIdsSchema.parse({ ids });
		const deps = createMeetingContentDeps();
		const count = await deleteMwbIssuesUseCase(deps, parsed.ids);

		revalidateMwb(slug);

		return {
			ok: true,
			data: { count },
		};
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível excluir as edições.",
		};
	}
}

export async function deleteAllMwbIssuesAction(
	slug: string,
	locale: "pt" | "es",
): Promise<ActionResult<{ count: number }>> {
	try {
		await requireMeetingContentManage(slug);

		const parsed = LocaleRequiredSchema.parse({ locale });
		const deps = createMeetingContentDeps();
		const count = await deleteAllMwbIssuesUseCase(deps, parsed.locale);

		revalidateMwb(slug);

		return {
			ok: true,
			data: { count },
		};
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível excluir as edições do idioma.",
		};
	}
}

export async function updateMwbIssueAction(
	slug: string,
	payload: unknown,
): Promise<ActionResult> {
	try {
		await requireMeetingContentManage(slug);
		const data = MwbIssueUpdateSchema.parse(payload);
		const deps = createMeetingContentDeps();
		const result = await updateMwbIssueUseCase(deps, data);
		if (!result.ok) return { ok: false, error: result.error };
		revalidateMwb(slug);
		return { ok: true, data: undefined };
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível salvar as alterações da apostila.",
		};
	}
}
