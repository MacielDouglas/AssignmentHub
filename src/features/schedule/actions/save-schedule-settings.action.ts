"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveScheduleSettingsUseCase } from "../application/save-schedule-settings.use-case";
import type { SaveScheduleSettingsState } from "../domain/schedule-settings.types";
import { initialSaveScheduleSettingsState } from "../domain/schedule-settings.types";
import { parseScheduleSettingsFormData } from "../lib/parse-schedule-settings-form-data";
import { validateScheduleBusinessRules } from "../lib/validate-schedule-business-rules";
import { saveScheduleSettingsSchema } from "../schemas/save-schedule-settings.schema";

export async function saveScheduleSettingsAction(
	_prevState: SaveScheduleSettingsState,
	formData: FormData,
): Promise<SaveScheduleSettingsState> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return {
			...initialSaveScheduleSettingsState,
			message: "Sessão inválida.",
		};
	}

	// Validar slug da organização (vem do hidden input no form)
	const slug = formData.get("organizationSlug");
	if (typeof slug !== "string" || !slug.trim()) {
		return {
			...initialSaveScheduleSettingsState,
			message: "Slug da organização inválido.",
		};
	}

	const payload = parseScheduleSettingsFormData(formData);
	const parsed = saveScheduleSettingsSchema.safeParse(payload);

	if (!parsed.success) {
		return {
			success: false,
			message: "Verifique os dados do formulário.",
			errors: parsed.error.flatten().fieldErrors,
		};
	}

	// Verificar se o slug corresponde ao organizationId
	const membership = await db.organizationMembership.findFirst({
		where: {
			userId: session.user.id,
			organizationId: parsed.data.organizationId,
		},
		select: {
			role: true,
			organization: {
				select: {
					slug: true,
				},
			},
		},
	});

	if (!membership) {
		return {
			...initialSaveScheduleSettingsState,
			message: "Organização não encontrada.",
		};
	}

	// Validação de segurança: slug do payload deve corresponder ao slug da organização no banco
	if (membership.organization.slug !== slug.trim()) {
		return {
			...initialSaveScheduleSettingsState,
			message: "Organização inválida.",
		};
	}

	const canManage = membership.role === "OWNER" || membership.role === "ADMIN";

	if (!canManage) {
		return {
			...initialSaveScheduleSettingsState,
			message: "Você não tem permissão para alterar essas configurações.",
		};
	}

	const businessValidation = validateScheduleBusinessRules(parsed.data);

	if (!businessValidation.isValid) {
		return {
			success: false,
			message: "Existem conflitos nas datas informadas.",
			errors: {
				_form: businessValidation.errors,
			},
		};
	}

	try {
		await saveScheduleSettingsUseCase(parsed.data);

		revalidatePath(`/org/${membership.organization.slug}/settings`);
		revalidatePath(`/org/${membership.organization.slug}/settings/data`);
		revalidatePath(`/org/${membership.organization.slug}/settings/agenda`);

		return {
			success: true,
			message: "Configurações de datas salvas com sucesso.",
			errors: {},
		};
	} catch (error) {
		console.error(error);

		return {
			...initialSaveScheduleSettingsState,
			message: "Ocorreu um erro ao salvar as configurações de datas.",
		};
	}
}
