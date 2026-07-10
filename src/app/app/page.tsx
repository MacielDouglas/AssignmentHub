import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type SessionWithRole = {
	user?: {
		id: string;
		role?: "USER" | "SUPER_ADMIN" | "admin" | "user";
	} | null;
	session?: {
		activeOrganizationId?: string | null;
	} | null;
};

export default async function AppEntryPage() {
	const session = (await auth.api.getSession({
		headers: await headers(),
	})) as SessionWithRole | null;

	if (!session?.user) {
		redirect("/");
	}

	const platformRole = session.user.role;
	const isSuperUser =
		platformRole === "SUPER_ADMIN" || platformRole === "admin";

	const activeOrganizationId = session.session?.activeOrganizationId ?? null;

	if (activeOrganizationId) {
		const activeOrganization = await db.organization.findUnique({
			where: { id: activeOrganizationId },
			select: { slug: true },
		});

		if (activeOrganization?.slug) {
			redirect(`/org/${activeOrganization.slug}`);
		}
	}

	const memberships = await db.organizationMember.findMany({
		where: {
			userId: session.user.id,
		},
		select: {
			organization: {
				select: {
					id: true,
					slug: true,
				},
			},
		},
		orderBy: {
			createdAt: "asc",
		},
	});

	const organizations = memberships
		.map((membership) => membership.organization)
		.filter((organization): organization is { id: string; slug: string } =>
			Boolean(organization?.id && organization?.slug),
		);

	if (organizations.length === 0) {
		if (isSuperUser) {
			redirect("/setup/organization");
		}

		redirect("/welcome");
	}

	if (organizations.length === 1) {
		redirect(`/org/${organizations[0].slug}`);
	}

	redirect("/select-organization");
}
