"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const createOrganizationSchema = z.object({
	name: z.string().trim().min(3, "Informe um nome válido."),
	slug: z
		.string()
		.trim()
		.min(3, "Informe um slug válido.")
		.regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen."),
});

type Input = {
	name: string;
	slug: string;
};

export async function createOrganizationAction(input: Input) {
	const parsed = createOrganizationSchema.safeParse(input);

	if (!parsed.success) {
		return {
			success: false,
			message: parsed.error.issues?.[0]?.message ?? "Dados inválidos.",
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

	const user = await db.user.findUnique({
		where: {
			id: session.user.id,
		},
		select: {
			id: true,
			role: true,
		},
	});

	if (!user || user.role !== "SUPER_ADMIN") {
		return {
			success: false,
			message: "Você não tem permissão para criar organizações.",
		};
	}

	const existingOrganization = await db.organization.findUnique({
		where: {
			slug: parsed.data.slug,
		},
		select: {
			id: true,
		},
	});

	if (existingOrganization) {
		return {
			success: false,
			message: "Esse slug já está em uso.",
		};
	}

	const organization = await db.organization.create({
		data: {
			name: parsed.data.name,
			slug: parsed.data.slug,
			members: {
				create: {
					userId: session.user.id,
					isOwner: true,
					isAdmin: true,
				},
			},
		},
		select: {
			slug: true,
		},
	});

	redirect(`/org/${organization.slug}`);
}
