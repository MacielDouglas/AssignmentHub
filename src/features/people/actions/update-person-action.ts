"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
	slug: z.string().min(1),
	personId: z.string().uuid("Pessoa inválida."),
	name: z.string().trim().min(2, "Informe o nome."),
	sex: z.enum(["MALE", "FEMALE"]),
	isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
	isStudent: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export type UpdatePersonActionState = {
	success: boolean;
	message: string;
};

async function requireOrgManager(slug: string, userId: string) {
	const currentUser = await db.user.findUnique({
		where: { id: userId },
		select: { systemRole: true },
	});

	if (currentUser?.systemRole === "SUPER_ADMIN") {
		const organization = await db.organization.findUnique({
			where: { slug },
			select: { id: true, slug: true },
		});

		if (!organization) {
			throw new Error("Organização não encontrada.");
		}

		return organization;
	}

	const membership = await db.organizationMembership.findFirst({
		where: {
			userId,
			organization: { slug },
			role: { in: ["OWNER", "ADMIN"] },
		},
		select: {
			organization: {
				select: {
					id: true,
					slug: true,
				},
			},
		},
	});

	if (!membership) {
		throw new Error("Você não tem permissão para editar pessoas.");
	}

	return membership.organization;
}

export async function updatePersonAction(
	_prevState: UpdatePersonActionState,
	formData: FormData,
): Promise<UpdatePersonActionState> {
	const parsed = schema.safeParse({
		slug: formData.get("slug"),
		personId: formData.get("personId"),
		name: formData.get("name"),
		sex: formData.get("sex"),
		isActive: formData.get("isActive"),
		isStudent: formData.get("isStudent"),
	});

	if (!parsed.success) {
		return {
			success: false,
			message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
		};
	}

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return {
			success: false,
			message: "Sessão inválida.",
		};
	}

	try {
		const organization = await requireOrgManager(
			parsed.data.slug,
			session.user.id,
		);

		const person = await db.person.findFirst({
			where: {
				id: parsed.data.personId,
				organizationId: organization.id,
			},
			select: { id: true },
		});

		if (!person) {
			return {
				success: false,
				message: "Pessoa não encontrada nessa organização.",
			};
		}

		await db.person.update({
			where: { id: parsed.data.personId },
			data: {
				name: parsed.data.name,
				sex: parsed.data.sex,
				isActive: parsed.data.isActive,
				isStudent: parsed.data.isStudent,
			},
		});

		revalidatePath(`/org/${organization.slug}/people`);

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
