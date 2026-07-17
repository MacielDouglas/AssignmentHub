"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import type { PersonActionState } from "@/features/people/actions/person-action-state";
import {
	createOrUpdatePerson,
	requirePeopleManager,
} from "@/features/people/lib/person-domain";
import { parsePersonFormData } from "@/features/people/lib/person-form-data";
import { personFormSchema } from "@/features/people/schemas/person-form-schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function updatePersonAction(
	_prevState: PersonActionState,
	formData: FormData,
): Promise<PersonActionState> {
	const parsed = personFormSchema.safeParse(parsePersonFormData(formData));

	if (!parsed.success || !parsed.data.personId) {
		return {
			success: false,
			message: "Dados inválidos.",
			fieldErrors: parsed.success
				? undefined
				: parsed.error.flatten().fieldErrors,
		};
	}

	const session = await auth.api.getSession({ headers: await headers() });

	if (!session?.user) {
		return { success: false, message: "Sessão inválida." };
	}

	try {
		const access = await requirePeopleManager(
			parsed.data.slug,
			session.user.id,
		);

		await db.$transaction(async (tx) => {
			await createOrUpdatePerson(tx, access, parsed.data);
		});

		revalidatePath(`/org/${access.slug}/people`);

		return {
			success: true,
			message: "Pessoa atualizada com sucesso.",
		};
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error ? error.message : "Erro ao atualizar pessoa.",
		};
	}
}
