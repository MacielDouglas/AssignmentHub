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

	const membership = await db.organizationMember.findFirst({
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

	if (!membership?.organization) {
		redirect("/welcome");
	}

	redirect(`/org/${membership.organization.slug}`);
}
