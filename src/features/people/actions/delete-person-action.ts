"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import type { PersonActionState } from "@/features/people/actions/person-action-state";
import {
	deletePersonWithRules,
	requirePeopleManager,
} from "@/features/people/lib/person-domain";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
	slug: z.string().min(1),
	personId: z.string().uuid(),
});

export async function deletePersonAction(
	_prevState: PersonActionState,
	formData: FormData,
): Promise<PersonActionState> {
	const parsed = schema.safeParse({
		slug: formData.get("slug"),
		personId: formData.get("personId"),
	});

	if (!parsed.success) {
		return {
			success: false,
			message: "Dados inválidos para exclusão.",
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
			await deletePersonWithRules(tx, access, parsed.data.personId);
		});

		revalidatePath(`/org/${access.slug}/people`);

		return {
			success: true,
			message: "Pessoa deletada com sucesso.",
		};
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error ? error.message : "Erro ao deletar pessoa.",
		};
	}
}
