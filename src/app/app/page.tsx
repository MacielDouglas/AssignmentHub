import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AppEntryPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/");
	}

	const activeOrganizationId =
		(session.session as { activeOrganizationId?: string | null } | null)
			?.activeOrganizationId ?? null;

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
		redirect("/welcome");
	}

	if (organizations.length === 1) {
		redirect(`/org/${organizations[0].slug}`);
	}

	redirect("/select-organization");
}
