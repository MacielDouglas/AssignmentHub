// src/features/cleaning/actions/save-cleaning-settings.action.ts
"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveCleaningSettingsUseCase } from "../application/save-cleaning-settings.use-case";
import {
	initialSaveCleaningSettingsState,
	type SaveCleaningSettingsState,
} from "../domain/cleaning-settings.types";
import { parseCleaningSettingsFormData } from "../lib/parse-cleaning-settings-form-data";
import { saveCleaningSettingsSchema } from "../schemas/save-cleaning-settings.schema";

export async function saveCleaningSettingsAction(
	_prev: SaveCleaningSettingsState,
	formData: FormData,
): Promise<SaveCleaningSettingsState> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return { ...initialSaveCleaningSettingsState, message: "Sessão inválida." };
	}

	const payload = parseCleaningSettingsFormData(formData);
	const parsed = saveCleaningSettingsSchema.safeParse(payload);

	if (!parsed.success) {
		return {
			success: false,
			message: "Verifique os dados do formulário.",
			errors: parsed.error.flatten().fieldErrors,
		};
	}

	const membership = await db.organizationMembership.findFirst({
		where: {
			userId: session.user.id,
			organizationId: parsed.data.organizationId,
		},
		select: {
			role: true,
			organization: { select: { slug: true } },
		},
	});

	if (!membership) {
		return {
			...initialSaveCleaningSettingsState,
			message: "Organização não encontrada.",
		};
	}

	if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
		return {
			...initialSaveCleaningSettingsState,
			message: "Você não tem permissão para alterar essas configurações.",
		};
	}

	try {
		await saveCleaningSettingsUseCase(parsed.data);
		revalidatePath(`/org/${membership.organization.slug}/settings`);
		revalidatePath(`/org/${membership.organization.slug}/settings/cleaning`);
		revalidatePath(`/org/${membership.organization.slug}/cleaning`);

		return {
			success: true,
			message: "Configurações de limpeza salvas com sucesso.",
			errors: {},
		};
	} catch (error) {
		console.error(error);
		return {
			...initialSaveCleaningSettingsState,
			message: "Ocorreu um erro ao salvar as configurações de limpeza.",
		};
	}
}
