"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { resolveCatalogScope } from "../../application/services/catalog-scope";
import { requireMeetingContentWriteAccess } from "../../application/services/require-meeting-content-write-access";
import { createPublicTalkUseCase } from "../../application/use-cases/create-public-talk.use-case";
import { deletePublicTalkHistoryUseCase } from "../../application/use-cases/delete-public-talk-history.use-case";
import { deletePublicTalksUseCase } from "../../application/use-cases/delete-public-talks.use-case";
import { registerPublicTalkHistoryUseCase } from "../../application/use-cases/register-public-talk-history.use-case";
import { updatePublicTalkUseCase } from "../../application/use-cases/update-public-talk.use-case";
import type { ContentLocale } from "../../domain/values-objects/content-locale";
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
	// organizationId: z.string().min(1),
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
	// organizationId: z.string().min(1),
	slug: z.string().min(1),
});

type ActionState = {
	success: boolean;
	error: string | null;
};

const initialState: ActionState = {
	success: false,
	error: null,
};

function revalidateMeetingContent(slug: string) {
	revalidatePath(`/org/${slug}/meeting-content`);
}

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
		return {
			success: false,
			error: "Dados inválidos para criar o discurso.",
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

		if (!result.ok) {
			return { success: false, error: result.error };
		}

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
			return { success: false, error: result.error };
		}

		revalidateMeetingContent(parsed.data.slug);
		return { success: true, error: null };
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

		if (!result.ok) {
			return { success: false, error: result.error };
		}

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

	const publicTalkRepository = new PublicTalkPrismaRepository();
	const historyRepository = new PublicTalkHistoryPrismaRepository();
	const speakerRepository = new SpeakerEligibilityPrismaRepository();

	const access = await requireMeetingContentWriteAccess(parsed.data.slug);

	if (!access.organizationId) {
		return {
			success: false,
			error: "Organização inválida.",
		};
	}

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

	if (!result.ok) {
		return {
			success: false,
			error: result.error,
		};
	}

	revalidateMeetingContent(parsed.data.slug);

	return initialState;
}

export async function deletePublicTalkHistoryAction(formData: FormData) {
	const parsed = deleteHistorySchema.safeParse({
		id: formData.get("id"),
		slug: formData.get("slug"),
	});

	if (!parsed.success) {
		return {
			success: false,
			error: "Não foi possível excluir o histórico.",
		};
	}

	try {
		const access = await requireMeetingContentWriteAccess(parsed.data.slug);

		if (!access.organizationId) {
			return {
				success: false,
				error: "Organização inválida.",
			};
		}

		const repository = new PublicTalkHistoryPrismaRepository();

		await deletePublicTalkHistoryUseCase(
			{ repository },
			{
				id: parsed.data.id,
				organizationId: access.organizationId,
			},
		);

		revalidateMeetingContent(parsed.data.slug);

		return {
			success: true,
			error: null,
		};
	} catch {
		return {
			success: false,
			error: "Você não tem permissão para excluir este histórico.",
		};
	}
}
