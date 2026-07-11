"use server";

import "server-only";

import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
	slug: z.string().min(1),
	personId: z.string().uuid("Pessoa inválida."),
	role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

type ActionState = {
	success: boolean;
	message: string;
};

async function requireOrgManagerForUserCreation(slug: string, userId: string) {
	const currentUser = await db.user.findUnique({
		where: { id: userId },
		select: { systemRole: true },
	});

	if (currentUser?.systemRole === "SUPER_ADMIN") {
		const organization = await db.organization.findUnique({
			where: { slug },
			select: { id: true, slug: true },
		});

		if (!organization) throw new Error("Organização não encontrada.");

		return {
			organizationId: organization.id,
			slug: organization.slug,
			actorRole: "SUPER_ADMIN" as const,
		};
	}

	const membership = await db.organizationMembership.findFirst({
		where: {
			userId,
			organization: { slug },
		},
		select: {
			role: true,
			organization: {
				select: {
					id: true,
					slug: true,
				},
			},
		},
	});

	if (!membership) {
		throw new Error("Você não pertence a essa organização.");
	}

	if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
		throw new Error("Você não tem permissão para criar usuários.");
	}

	return {
		organizationId: membership.organization.id,
		slug: membership.organization.slug,
		actorRole: membership.role,
	};
}

export async function createUserFromPersonAction(
	_prevState: ActionState,
	formData: FormData,
): Promise<ActionState> {
	const parsed = schema.safeParse({
		slug: formData.get("slug"),
		personId: formData.get("personId"),
		role: formData.get("role"),
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
		const access = await requireOrgManagerForUserCreation(
			parsed.data.slug,
			session.user.id,
		);

		if (access.actorRole === "ADMIN" && parsed.data.role === "OWNER") {
			return {
				success: false,
				message: "Admin não pode promover usuário para owner.",
			};
		}

		const person = await db.person.findFirst({
			where: {
				id: parsed.data.personId,
				organizationId: access.organizationId,
			},
			select: {
				id: true,
				name: true,
				user: {
					select: {
						id: true,
					},
				},
			},
		});

		if (!person) {
			return {
				success: false,
				message: "Pessoa não encontrada.",
			};
		}

		if (person.user) {
			return {
				success: false,
				message: "Essa pessoa já possui um usuário vinculado.",
			};
		}

		return {
			success: false,
			message:
				"Usuário deve entrar primeiro com Google. Depois vincule a conta social existente a esta pessoa.",
		};
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error ? error.message : "Erro ao criar usuário.",
		};
	}
}
