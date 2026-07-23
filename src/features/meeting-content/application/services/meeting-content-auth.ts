import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type MeetingContentAccess = {
	userId: string;
	canManage: boolean;
	isSuperAdmin: boolean;
};

export async function getMeetingContentAccess(
	slug?: string,
): Promise<MeetingContentAccess | null> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) return null;

	const user = await db.user.findUnique({
		where: { id: session.user.id },
		select: { id: true, systemRole: true },
	});

	if (!user) return null;

	const isSuperAdmin = user.systemRole === "SUPER_ADMIN";

	if (isSuperAdmin) {
		return { userId: user.id, canManage: true, isSuperAdmin: true };
	}

	if (slug) {
		const membership = await db.organizationMembership.findFirst({
			where: {
				userId: user.id,
				organization: { slug },
			},
			select: { role: true },
		});

		if (!membership) return null;

		const canManage =
			membership.role === "OWNER" || membership.role === "ADMIN";

		return { userId: user.id, canManage, isSuperAdmin: false };
	}

	const adminMembership = await db.organizationMembership.findFirst({
		where: {
			userId: user.id,
			role: { in: ["OWNER", "ADMIN"] },
		},
		select: { id: true },
	});

	return {
		userId: user.id,
		canManage: Boolean(adminMembership),
		isSuperAdmin: false,
	};
}

export async function requireMeetingContentManage(slug?: string) {
	const access = await getMeetingContentAccess(slug);
	if (!access) {
		throw new Error("Não autenticado.");
	}
	if (!access.canManage) {
		throw new Error("Sem permissão. Apenas SUPER_ADMIN, OWNER ou ADMIN.");
	}
	return access;
}
