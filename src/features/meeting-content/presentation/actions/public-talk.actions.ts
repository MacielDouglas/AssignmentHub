"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { PublicTalksExtractSchema } from "../../application/dto/public-talks-extract.dto";
import { resolveCatalogScope } from "../../application/services/catalog-scope";
import { requireMeetingContentWriteAccess } from "../../application/services/require-meeting-content-write-access";
import { commitPublicTalksImportUseCase } from "../../application/use-cases/commit-public-talks-import.use-case";
import { createAndProcessPublicTalksImportUseCase } from "../../application/use-cases/create-and-process-public-talks-import.use-case";
import { createPublicTalkUseCase } from "../../application/use-cases/create-public-talk.use-case";
import { deletePublicTalkHistoryUseCase } from "../../application/use-cases/delete-public-talk-history.use-case";
import { deletePublicTalksUseCase } from "../../application/use-cases/delete-public-talks.use-case";
import { discardPublicTalksImportUseCase } from "../../application/use-cases/discard-public-talks-import.use-case";
import { registerPublicTalkHistoryUseCase } from "../../application/use-cases/register-public-talk-history.use-case";
import { updatePublicTalkUseCase } from "../../application/use-cases/update-public-talk.use-case";
import { updatePublicTalksImportDraftUseCase } from "../../application/use-cases/update-public-talks-import-draft.use-case";
import type { ContentLocale } from "../../domain/values-objects/content-locale";
import { PrismaContentImportJobRepository } from "../../infrastructure/prisma/content-import-job.prisma-repository";
import { PublicTalkHistoryPrismaRepository } from "../../infrastructure/prisma/public-talk-history-prisma-repository";
import { PublicTalkPrismaRepository } from "../../infrastructure/prisma/public-talk-prisma-repository";
import { SpeakerEligibilityPrismaRepository } from "../../infrastructure/prisma/speaker-eligibility-prisma-repository";

const catalogScopeSchema = z.enum(["GLOBAL", "LOCAL"]);

const publicTalkSchema = z.object({
	id: z.string().min(1).optional(),
	locale: z.enum(["pt", "es"]),
	number: z.coerce.number().int().min(1).max(999),
	title: z.string().trim().min(1).max(300),
	notes: z.string().trim().max(5000).optional().nullable(),
	scope: catalogScopeSchema.default("LOCAL"),
	slug: z.string().trim().min(1).max(120),
});

const deletePublicTalksSchema = z.object({
	ids: z.array(z.string().min(1)).min(1),
	slug: z.string().min(1),
});

const registerHistorySchema = z.object({
	publicTalkId: z.string().min(1),
	performedAt: z.coerce.date(),
	notes: z.string().trim().max(5000).optional().nullable(),
	speakerType: z.enum(["PERSON", "SUB_PERSON"]),
	speakerPersonId: z.string().optional().nullable(),
	speakerSubPersonId: z.string().optional().nullable(),
	slug: z.string().min(1),
});

const deleteHistorySchema = z.object({
	id: z.string().min(1),
	organizationId: z.string().min(1),
	slug: z.string().min(1),
});

const JobIdSchema = z.object({ jobId: z.string().min(1) });

type ActionState = {
	success: boolean;
	error: string | null;
};

type ActionResult<T = void> =
	| { ok: true; data: T }
	| { ok: false; error: string };

function revalidateMeetingContent(slug: string) {
	revalidatePath(`/org/${slug}/meeting-content`);
	revalidatePath(`/org/${slug}/meeting-content/discursos`);
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function createPublicTalkAction(
	_prevState: ActionState,
	formData: FormData,
): Promise<ActionState> {
	const parsed = publicTalkSchema.safeParse({
		locale: formData.get("locale"),
		number: formData.get("number"),
		title: formData.get("title"),
		notes: formData.get("notes"),
		scope: formData.get("scope") ?? "LOCAL",
		slug: formData.get("slug"),
	});

	if (!parsed.success) {
		return { success: false, error: "Dados inválidos para criar o discurso." };
	}

	try {
		const access = await requireMeetingContentWriteAccess(parsed.data.slug);
		if (!access.organizationId) {
			return { success: false, error: "Organização inválida." };
		}

		const catalog = resolveCatalogScope({
			organizationId: access.organizationId,
			isSuperAdmin: access.isSuperAdmin,
			requestedScope: parsed.data.scope,
		});

		const repository = new PublicTalkPrismaRepository();
		const result = await createPublicTalkUseCase(
			{ repository },
			{
				organizationId: catalog.organizationId,
				locale: parsed.data.locale as ContentLocale,
				number: parsed.data.number,
				title: parsed.data.title,
				notes: parsed.data.notes ?? null,
			},
		);

		if (!result.ok) return { success: false, error: result.error };

		revalidateMeetingContent(parsed.data.slug);
		return { success: true, error: null };
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível criar o discurso.",
		};
	}
}

export async function updatePublicTalkAction(
	_prevState: ActionState,
	formData: FormData,
): Promise<ActionState> {
	const parsed = publicTalkSchema.extend({ id: z.string().min(1) }).safeParse({
		id: formData.get("id"),
		locale: formData.get("locale"),
		number: formData.get("number"),
		title: formData.get("title"),
		notes: formData.get("notes"),
		scope: formData.get("scope") ?? "LOCAL",
		slug: formData.get("slug"),
	});

	if (!parsed.success) {
		return {
			success: false,
			error: "Dados inválidos para atualizar o discurso.",
		};
	}

	try {
		const access = await requireMeetingContentWriteAccess(parsed.data.slug);
		if (!access.organizationId) {
			return { success: false, error: "Organização inválida." };
		}

		const catalog = resolveCatalogScope({
			organizationId: access.organizationId,
			isSuperAdmin: access.isSuperAdmin,
			requestedScope: parsed.data.scope,
		});

		const repository = new PublicTalkPrismaRepository();
		const result = await updatePublicTalkUseCase(
			{ repository },
			{
				id: parsed.data.id,
				organizationId: catalog.organizationId,
				locale: parsed.data.locale as ContentLocale,
				number: parsed.data.number,
				title: parsed.data.title,
				notes: parsed.data.notes ?? null,
				actorOrganizationId: access.organizationId,
				isSuperAdmin: access.isSuperAdmin,
			},
		);
		if (!result.ok) {
			return {
				success: false,
				error: result.error,
			};
		}

		revalidateMeetingContent(parsed.data.slug);

		return {
			success: true,
			error: null,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível atualizar o discurso.",
		};
	}
}

export async function deletePublicTalksAction(formData: FormData) {
	const ids = formData.getAll("ids").map(String);
	const parsed = deletePublicTalksSchema.safeParse({
		ids,
		slug: formData.get("slug"),
	});

	if (!parsed.success) {
		return { success: false, error: "Nenhum discurso foi selecionado." };
	}

	try {
		const access = await requireMeetingContentWriteAccess(parsed.data.slug);
		const repository = new PublicTalkPrismaRepository();

		const result = await deletePublicTalksUseCase(
			{ repository },
			{
				ids: parsed.data.ids,
				actorOrganizationId: access.organizationId,
				isSuperAdmin: access.isSuperAdmin,
			},
		);

		if (!result.ok) return { success: false, error: result.error };

		revalidateMeetingContent(parsed.data.slug);
		return { success: true, error: null };
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível excluir os discursos.",
		};
	}
}

export async function registerPublicTalkHistoryAction(
	_prevState: ActionState,
	formData: FormData,
): Promise<ActionState> {
	const parsed = registerHistorySchema.safeParse({
		publicTalkId: formData.get("publicTalkId"),
		performedAt: formData.get("performedAt"),
		notes: formData.get("notes"),
		speakerType: formData.get("speakerType"),
		speakerPersonId: formData.get("speakerPersonId"),
		speakerSubPersonId: formData.get("speakerSubPersonId"),
		slug: formData.get("slug"),
	});

	if (!parsed.success) {
		return {
			success: false,
			error: "Dados inválidos para registrar o histórico.",
		};
	}

	try {
		const access = await requireMeetingContentWriteAccess(parsed.data.slug);
		if (!access.organizationId) {
			return { success: false, error: "Organização inválida." };
		}

		const publicTalkRepository = new PublicTalkPrismaRepository();
		const historyRepository = new PublicTalkHistoryPrismaRepository();
		const speakerRepository = new SpeakerEligibilityPrismaRepository();

		const talk = await publicTalkRepository.findById(parsed.data.publicTalkId);

		if (
			!talk ||
			(talk.organizationId !== null &&
				talk.organizationId !== access.organizationId)
		) {
			return {
				success: false,
				error: "Discurso inválido para esta organização.",
			};
		}

		const result = await registerPublicTalkHistoryUseCase(
			{ publicTalkRepository, historyRepository, speakerRepository },
			{
				organizationId: access.organizationId,
				publicTalkId: parsed.data.publicTalkId,
				performedAt: parsed.data.performedAt,
				notes: parsed.data.notes ?? null,
				speakerPersonId:
					parsed.data.speakerType === "PERSON"
						? (parsed.data.speakerPersonId ?? null)
						: null,
				speakerSubPersonId:
					parsed.data.speakerType === "SUB_PERSON"
						? (parsed.data.speakerSubPersonId ?? null)
						: null,
			},
		);

		if (!result.ok) return { success: false, error: result.error };

		revalidateMeetingContent(parsed.data.slug);
		return { success: true, error: null };
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível registrar o histórico.",
		};
	}
}

export async function deletePublicTalkHistoryAction(
	formData: FormData,
): Promise<ActionState> {
	const parsed = deleteHistorySchema.safeParse({
		id: formData.get("id"),
		organizationId: formData.get("organizationId"),
		slug: formData.get("slug"),
	});

	if (!parsed.success) {
		return {
			success: false,
			error: "Não foi possível excluir o histórico.",
		};
	}

	const histories = new PublicTalkHistoryPrismaRepository();

	const result = await deletePublicTalkHistoryUseCase(
		{ histories },
		{
			id: parsed.data.id,
			organizationId: parsed.data.organizationId,
		},
	);

	if (!result.ok) {
		return {
			success: false,
			error: result.error,
		};
	}

	revalidateMeetingContent(parsed.data.slug);

	return {
		success: true,
		error: null,
	};
}

// ─── Import JWPub (S-34) ─────────────────────────────────────────────────────

export async function createAndProcessPublicTalksImportAction(
	slug: string,
	formData: FormData,
): Promise<ActionResult<{ jobId: string }>> {
	try {
		const access = await requireMeetingContentWriteAccess(slug);
		if (!access.organizationId) {
			return { ok: false, error: "Organização inválida." };
		}

		const file = formData.get("file");
		if (!(file instanceof File)) {
			return { ok: false, error: "Arquivo ausente." };
		}

		const jobs = new PrismaContentImportJobRepository();

		const result = await createAndProcessPublicTalksImportUseCase(
			{ jobs },
			{ file },
		);

		if (!result.ok) return { ok: false, error: result.error };

		revalidateMeetingContent(slug);
		return { ok: true, data: { jobId: result.jobId } };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Erro ao importar.",
		};
	}
}

export async function updatePublicTalksImportDraftAction(
	slug: string,
	jobId: string,
	payload: unknown,
): Promise<ActionResult> {
	try {
		await requireMeetingContentWriteAccess(slug);
		const id = JobIdSchema.parse({ jobId }).jobId;
		PublicTalksExtractSchema.parse(payload);

		const jobs = new PrismaContentImportJobRepository();
		const result = await updatePublicTalksImportDraftUseCase(
			{ jobs },
			id,
			payload,
		);

		if (!result.ok) return { ok: false, error: result.error };

		revalidateMeetingContent(slug);
		return { ok: true, data: undefined };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Erro ao salvar rascunho.",
		};
	}
}

export async function commitPublicTalksImportAction(
	slug: string,
	jobId: string,
): Promise<ActionResult<{ upserted: number }>> {
	try {
		const access = await requireMeetingContentWriteAccess(slug);
		if (!access.organizationId) {
			return { ok: false, error: "Organização inválida." };
		}

		const id = JobIdSchema.parse({ jobId }).jobId;
		const jobs = new PrismaContentImportJobRepository();
		const publicTalks = new PublicTalkPrismaRepository();

		const result = await commitPublicTalksImportUseCase(
			{ jobs, publicTalks },
			id,
		);
		if (!result.ok) return { ok: false, error: result.error };

		revalidateMeetingContent(slug);
		return { ok: true, data: { upserted: result.upserted } };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Erro ao confirmar.",
		};
	}
}

export async function discardPublicTalksImportAction(
	slug: string,
	jobId: string,
): Promise<ActionResult> {
	try {
		await requireMeetingContentWriteAccess(slug);
		const id = JobIdSchema.parse({ jobId }).jobId;

		const jobs = new PrismaContentImportJobRepository();
		const result = await discardPublicTalksImportUseCase({ jobs }, id);

		if (!result.ok) return { ok: false, error: result.error };

		revalidateMeetingContent(slug);
		return { ok: true, data: undefined };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Erro ao descartar.",
		};
	}
}
