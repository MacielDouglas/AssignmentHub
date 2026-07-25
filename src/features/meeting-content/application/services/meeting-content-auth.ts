import "server-only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type MeetingContentAccess = {
	userId: string;
	organizationId: string | null;
	canManage: boolean;
	isSuperAdmin: boolean;
};

export async function getMeetingContentAccess(
	slug?: string,
): Promise<MeetingContentAccess | null> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return null;
	}

	const user = await db.user.findUnique({
		where: { id: session.user.id },
		select: {
			id: true,
			systemRole: true,
		},
	});

	if (!user) {
		return null;
	}

	const isSuperAdmin = user.systemRole === "SUPER_ADMIN";

	if (!slug) {
		if (isSuperAdmin) {
			return {
				userId: user.id,
				organizationId: null,
				canManage: true,
				isSuperAdmin: true,
			};
		}

		const adminMembership = await db.organizationMembership.findFirst({
			where: {
				userId: user.id,
				role: {
					in: ["OWNER", "ADMIN"],
				},
			},
			select: {
				organizationId: true,
			},
			orderBy: {
				createdAt: "asc",
			},
		});

		return {
			userId: user.id,
			organizationId: adminMembership?.organizationId ?? null,
			canManage: Boolean(adminMembership),
			isSuperAdmin: false,
		};
	}

	const organization = await db.organization.findUnique({
		where: { slug },
		select: {
			id: true,
		},
	});

	if (!organization) {
		return null;
	}

	if (isSuperAdmin) {
		return {
			userId: user.id,
			organizationId: organization.id,
			canManage: true,
			isSuperAdmin: true,
		};
	}

	const membership = await db.organizationMembership.findUnique({
		where: {
			organizationId_userId: {
				organizationId: organization.id,
				userId: user.id,
			},
		},
		select: {
			role: true,
		},
	});

	if (!membership) {
		return null;
	}

	return {
		userId: user.id,
		organizationId: organization.id,
		canManage: membership.role === "OWNER" || membership.role === "ADMIN",
		isSuperAdmin: false,
	};
}

export async function requireMeetingContentManage(slug: string) {
	const access = await getMeetingContentAccess(slug);

	if (!access) {
		throw new Error("Não autenticado ou sem acesso à organização.");
	}

	if (!access.canManage || !access.organizationId) {
		throw new Error(
			"Sem permissão. Apenas SUPER_ADMIN, OWNER ou ADMIN podem alterar este conteúdo.",
		);
	}

	return access;
}
