import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { OrgHeader } from "@/components/org/org-header";
import { OrgSidebar } from "@/components/org/org-sidebar";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type OrgLayoutProps = {
	children: React.ReactNode;
	params: Promise<{
		slug: string;
	}>;
};

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
	const { slug } = await params;

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/");
	}

	const memberships = await db.organizationMembership.findMany({
		where: {
			userId: session.user.id,
		},
		select: {
			role: true,
			organization: {
				select: {
					id: true,
					name: true,
					slug: true,
				},
			},
		},
		orderBy: {
			createdAt: "asc",
		},
	});

	const organizations = memberships.map((membership) => ({
		id: membership.organization.id,
		name: membership.organization.name,
		slug: membership.organization.slug,
		role: membership.role,
	}));

	const currentOrganization = organizations.find(
		(organization) => organization.slug === slug,
	);

	if (!currentOrganization) {
		notFound();
	}

	return (
		<div className="min-h-screen bg-background text-foreground">
			<div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
				<OrgSidebar
					currentSlug={slug}
					organizationName={currentOrganization.name}
				/>

				<div className="flex min-h-screen flex-col">
					<OrgHeader
						currentOrganization={currentOrganization}
						organizations={organizations}
						userName={session.user.name ?? "Usuário"}
						userEmail={session.user.email}
					/>

					<main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
				</div>
			</div>
		</div>
	);
}
