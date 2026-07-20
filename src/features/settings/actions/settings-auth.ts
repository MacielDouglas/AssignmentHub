import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function requireSettingsManager(organizationSlug: string) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return { ok: false as const, message: "Sessão inválida." };
	}

	const membership = await db.organizationMembership.findFirst({
		where: {
			userId: session.user.id,
			organization: { slug: organizationSlug },
		},
		select: {
			role: true,
			organization: {
				select: { id: true, slug: true, name: true },
			},
		},
	});

	if (!membership) {
		return {
			ok: false as const,
			message: "Você não pertence a esta organização.",
		};
	}

	if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
		return {
			ok: false as const,
			message: "Você não tem permissão para editar configurações.",
		};
	}

	return {
		ok: true as const,
		organization: membership.organization,
	};
}
