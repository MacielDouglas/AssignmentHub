import { headers } from "next/headers";

import type { OrganizationRole } from "@/generated/prisma/client";
import { auth } from "@/lib/auth"; // better-auth (ajuste se o path for outro)
import { db } from "@/lib/db";

type Ok = {
	ok: true;
	userId: string;
	role: OrganizationRole;
	organization: { id: string; slug: string; name: string };
};

type Fail = {
	ok: false;
	reason: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND";
	message: string;
};

export async function requireOrgMember(slug: string): Promise<Ok | Fail> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return {
			ok: false,
			reason: "UNAUTHENTICATED",
			message: "Faça login.",
		};
	}

	const organization = await db.organization.findUnique({
		where: { slug },
		select: { id: true, slug: true, name: true },
	});

	if (!organization) {
		return {
			ok: false,
			reason: "NOT_FOUND",
			message: "Organização não encontrada.",
		};
	}

	const membership = await db.organizationMembership.findFirst({
		where: {
			organizationId: organization.id,
			userId: session.user.id,
		},
		select: { role: true },
	});

	if (!membership) {
		return {
			ok: false,
			reason: "FORBIDDEN",
			message: "Você não pertence a esta organização.",
		};
	}

	return {
		ok: true,
		userId: session.user.id,
		role: membership.role,
		organization,
	};
}
