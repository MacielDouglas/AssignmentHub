"use server";

import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
	name: z.string().trim().min(3, "Informe um nome válido."),
	slug: z
		.string()
		.trim()
		.min(3, "Informe um slug válido.")
		.regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen."),
});

export type CreateOrganizationActionState = {
	success: boolean;
	message: string;
};

export async function createOrganizationAction(
	_prevState: CreateOrganizationActionState,
	formData: FormData,
): Promise<CreateOrganizationActionState> {
	const parsed = schema.safeParse({
		name: formData.get("name"),
		slug: formData.get("slug"),
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

	const currentUser = await db.user.findUnique({
		where: { id: session.user.id },
		select: { id: true, systemRole: true },
	});

	if (currentUser?.systemRole !== "SUPER_ADMIN") {
		return {
			success: false,
			message: "Você não tem permissão para criar organizações.",
		};
	}

	const existing = await db.organization.findUnique({
		where: { slug: parsed.data.slug },
		select: { id: true },
	});

	if (existing) {
		return {
			success: false,
			message: "Esse slug já está em uso.",
		};
	}

	const organization = await db.$transaction(async (tx) => {
		const createdOrganization = await tx.organization.create({
			data: {
				name: parsed.data.name,
				slug: parsed.data.slug,
			},
			select: {
				id: true,
				slug: true,
			},
		});

		await tx.organizationMembership.create({
			data: {
				organizationId: createdOrganization.id,
				userId: currentUser.id,
				role: "OWNER",
			},
		});

		return createdOrganization;
	});

	redirect(`/org/${organization.slug}`);
}
