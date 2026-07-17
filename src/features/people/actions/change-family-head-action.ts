"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import type { PersonActionState } from "@/features/people/actions/person-action-state";
import {
	removeFamilyHeadWithDecision,
	requirePeopleManager,
} from "@/features/people/lib/person-domain";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
	slug: z.string().min(1),
	personId: z.string().uuid(),
	headRemovalAction: z.enum(["REASSIGN", "DISSOLVE"]),
	newHeadPersonId: z.string().uuid().optional(),
});

export async function changeFamilyHeadAction(
	_prevState: PersonActionState,
	formData: FormData,
): Promise<PersonActionState> {
	const parsed = schema.safeParse({
		slug: formData.get("slug"),
		personId: formData.get("personId"),
		headRemovalAction: formData.get("headRemovalAction"),
		newHeadPersonId:
			typeof formData.get("newHeadPersonId") === "string" &&
			formData.get("newHeadPersonId") !== ""
				? formData.get("newHeadPersonId")
				: undefined,
	});

	if (!parsed.success) {
		return {
			success: false,
			message: "Dados inválidos.",
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
			await removeFamilyHeadWithDecision(
				tx,
				access,
				parsed.data.personId,
				parsed.data.headRemovalAction,
				parsed.data.newHeadPersonId,
			);

			await tx.person.update({
				where: { id: parsed.data.personId },
				data: { familyId: null },
			});
		});

		revalidatePath(`/org/${access.slug}/people`);

		return {
			success: true,
			message: "Chefia atualizada com sucesso.",
		};
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error ? error.message : "Erro ao alterar chefia.",
		};
	}
}
