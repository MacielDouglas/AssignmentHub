"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
	slug: z.string().min(1),
	name: z.string().trim().min(2, "Informe o nome."),
	sex: z.enum(["MALE", "FEMALE"]),
	isStudent: z
		.string()
		.transform((value) => value === "true")
		.optional(),
});

type ActionState = {
	success: boolean;
	message: string;
};

async function requireOrgManager(slug: string, userId: string) {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { systemRole: true },
	});

	if (user?.systemRole === "SUPER_ADMIN") {
		const organization = await db.organization.findUnique({
			where: { slug },
			select: { id: true, slug: true },
		});

		if (!organization) throw new Error("Organização não encontrada.");
		return { organizationId: organization.id, slug: organization.slug };
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
		throw new Error("Você não tem permissão para criar pessoas.");
	}

	return {
		organizationId: membership.organization.id,
		slug: membership.organization.slug,
	};
}

export async function createPersonAction(
	_prevState: ActionState,
	formData: FormData,
): Promise<ActionState> {
	const parsed = schema.safeParse({
		slug: formData.get("slug"),
		name: formData.get("name"),
		sex: formData.get("sex"),
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
		const org = await requireOrgManager(parsed.data.slug, session.user.id);

		await db.person.create({
			data: {
				organizationId: org.organizationId,
				name: parsed.data.name,
				sex: parsed.data.sex,
				isActive: true,
				isStudent: parsed.data.isStudent ?? true,
			},
		});

		revalidatePath(`/org/${org.slug}/people`);

		return {
			success: true,
			message: "Pessoa criada com sucesso.",
		};
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : "Erro ao criar pessoa.",
		};
	}
}
