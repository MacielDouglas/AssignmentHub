import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { OrgHeader } from "@/components/org/org-header";
import { OrgMobileDrawer } from "@/components/org/org-mobile-drawer";
import { OrgSidebar } from "@/components/org/org-sidebar";
// import { Breadcrumb } from "@/components/ui/breadcrumb";
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

	if (!session?.user) {
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

	const currentMembership = memberships.find(
		(membership) => membership.organization.slug === slug,
	);

	if (!currentMembership) {
		notFound();
	}

	const currentOrganization = currentMembership.organization;
	const organizations = memberships.map(
		(membership) => membership.organization,
	);

	const breadcrumbLabels: Record<string, string> = {
		org: "Organizações",
		[currentOrganization.slug]: currentOrganization.name,
		people: "Pessoas",
		groups: "Grupos",
		families: "Famílias",
		"sub-organizations": "Suborganizações",
		outlines: "Discursos",
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
						organizations={organizations}
						userName={session.user.name ?? "Usuário"}
						userEmail={session.user.email}
					/>

					<div className="flex-1 p-4 md:p-6">
						<div className="mx-auto flex w-full max-w-7xl flex-col gap-4 md:gap-6">
							<OrgMobileDrawer
								currentOrganization={currentOrganization}
								organizations={organizations}
								userName={session.user.name ?? "Usuário"}
								userEmail={session.user.email}
							/>

							<AppBreadcrumbs
								labelMap={breadcrumbLabels}
								hrefLabelMap={breadcrumbHrefLabels}
							/>

							{/* <Breadcrumb
								labelMap={breadcrumbLabels}
								hrefLabelMap={breadcrumbHrefLabels}
							/> */}

							<main>{children}</main>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
