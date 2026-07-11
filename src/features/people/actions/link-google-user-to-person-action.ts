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
	userId: z.string().min(1, "Usuário inválido."),
	role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

type ActionState = {
	success: boolean;
	message: string;
};

async function requireOrgManagerForLink(slug: string, actorUserId: string) {
	const currentUser = await db.user.findUnique({
		where: { id: actorUserId },
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
			userId: actorUserId,
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
		throw new Error("Você não tem permissão para vincular usuários.");
	}

	return {
		organizationId: membership.organization.id,
		slug: membership.organization.slug,
		actorRole: membership.role,
	};
}

export async function linkGoogleUserToPersonAction(
	_prevState: ActionState,
	formData: FormData,
): Promise<ActionState> {
	const parsed = schema.safeParse({
		slug: formData.get("slug"),
		personId: formData.get("personId"),
		userId: formData.get("userId"),
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
		const access = await requireOrgManagerForLink(
			parsed.data.slug,
			session.user.id,
		);

		if (access.actorRole === "ADMIN" && parsed.data.role === "OWNER") {
			return {
				success: false,
				message: "Admin não pode promover usuário para owner.",
			};
		}

		const organizationId = access.organizationId;

		const person = await db.person.findFirst({
			where: {
				id: parsed.data.personId,
				organizationId,
			},
			select: {
				id: true,
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
				message: "Pessoa não encontrada nessa organização.",
			};
		}

		if (person.user) {
			return {
				success: false,
				message: "Essa pessoa já possui um usuário vinculado.",
			};
		}

		const user = await db.user.findUnique({
			where: { id: parsed.data.userId },
			select: {
				id: true,
				email: true,
				systemRole: true,
				memberships: {
					select: {
						organizationId: true,
					},
				},
			},
		});

		if (!user) {
			return {
				success: false,
				message: "Usuário não encontrado.",
			};
		}

		if (user.memberships.length > 0) {
			return {
				success: false,
				message: "Esse usuário já pertence a uma organização.",
			};
		}

		await db.user.update({
			where: { id: user.id },
			data: {
				personId: person.id,
			},
		});

		await db.organizationMembership.create({
			data: {
				organizationId,
				userId: user.id,
				role: parsed.data.role,
			},
		});

		revalidatePath(`/org/${access.slug}/people`);

		return {
			success: true,
			message: "Usuário vinculado à pessoa com sucesso.",
		};
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: "Erro ao vincular usuário à pessoa.",
		};
	}
}
