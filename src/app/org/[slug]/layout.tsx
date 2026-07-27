import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { OrgHeader } from "@/components/org/org-header";
import { OrgMobileDrawer } from "@/components/org/org-mobile-drawer";
import { OrgSidebar } from "@/components/org/org-sidebar";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type OrganizationLayoutProps = {
	children: React.ReactNode;
	params: Promise<{
		slug: string;
	}>;
};

export default async function OrganizationLayout({
	children,
	params,
}: OrganizationLayoutProps) {
	const { slug } = await params;

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		notFound();
	}

	const user = await db.user.findUnique({
		where: {
			id: session.user.id,
		},
		select: {
			systemRole: true,
		},
	});

	if (!user) {
		notFound();
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
			organization: {
				name: "asc",
			},
		},
	});

	const membershipForCurrentOrganization = memberships.find(
		(membership) => membership.organization.slug === slug,
	);

	const currentOrganization = membershipForCurrentOrganization
		? membershipForCurrentOrganization.organization
		: user.systemRole === "SUPER_ADMIN"
			? await db.organization.findUnique({
					where: {
						slug,
					},
					select: {
						id: true,
						name: true,
						slug: true,
					},
				})
			: null;

	if (!currentOrganization) {
		notFound();
	}

	const organizations = memberships.map(
		(membership) => membership.organization,
	);

	const organizationsForHeader = organizations.some(
		(organization) => organization.id === currentOrganization.id,
	)
		? organizations
		: [currentOrganization, ...organizations];

	const breadcrumbLabels: Record<string, string> = {
		org: "Organizações",
		[currentOrganization.slug]: currentOrganization.name,
		people: "Pessoas",
		groups: "Grupos",
		families: "Famílias",
		"sub-organizations": "Suborganizações",
		outlines: "Discursos",
		meetings: "Reuniões",
		settings: "Configurações",
	};

	const breadcrumbHrefLabels: Record<string, string> = {
		"/org": "Organizações",
		[`/org/${currentOrganization.slug}`]: currentOrganization.name,
		[`/org/${currentOrganization.slug}/people`]: "Pessoas",
		[`/org/${currentOrganization.slug}/groups`]: "Grupos",
		[`/org/${currentOrganization.slug}/families`]: "Famílias",
		[`/org/${currentOrganization.slug}/sub-organizations`]: "Suborganizações",
		[`/org/${currentOrganization.slug}/outlines`]: "Discursos",
		[`/org/${currentOrganization.slug}/meetings`]: "Reuniões",
		[`/org/${currentOrganization.slug}/settings`]: "Configurações",
	};

	return (
		<div className="min-h-screen bg-background">
			<div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
				<OrgSidebar
					currentSlug={currentOrganization.slug}
					organizationName={currentOrganization.name}
				/>

				<div className="flex min-h-screen flex-col">
					<OrgHeader
						currentOrganization={currentOrganization}
						organizations={organizationsForHeader}
						userName={session.user.name ?? "Usuário"}
						userEmail={session.user.email}
					/>

					<div className="flex-1 p-4 md:p-6">
						<div className="mx-auto flex w-full max-w-7xl flex-col gap-4 md:gap-6">
							<OrgMobileDrawer
								currentOrganization={currentOrganization}
								organizations={organizationsForHeader}
								userName={session.user.name ?? "Usuário"}
								userEmail={session.user.email}
							/>

							<AppBreadcrumbs
								labelMap={breadcrumbLabels}
								hrefLabelMap={breadcrumbHrefLabels}
							/>

							<main>{children}</main>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
