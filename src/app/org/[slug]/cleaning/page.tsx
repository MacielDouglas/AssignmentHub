import { notFound, redirect } from "next/navigation";

import { CleaningShell } from "@/features/cleaning/components/cleaning-shell";
import { loadCleaningPageData } from "@/features/cleaning/lib/load-cleaning-page";
import { requireOrgMember } from "@/features/cleaning/lib/require-org-member";

type Props = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ tab?: string }>;
};

export default async function CleaningPage({ params, searchParams }: Props) {
	const { slug } = await params;
	const { tab: tabParam } = await searchParams;

	const access = await requireOrgMember(slug);
	if (!access.ok) {
		if (access.reason === "UNAUTHENTICATED") {
			redirect("/login");
		}
		notFound();
	}

	const canManage = access.role === "OWNER" || access.role === "ADMIN";

	const tab =
		tabParam === "gerar" || tabParam === "tabela"
			? tabParam
			: canManage
				? "gerar"
				: "tabela";

	if (!canManage && tab === "gerar") {
		redirect(`/org/${slug}/cleaning?tab=tabela`);
	}

	const data = await loadCleaningPageData({
		organizationId: access.organization.id,
		organizationSlug: access.organization.slug,
		canManage,
		userId: access.userId,
	});

	return <CleaningShell data={data} initialTab={tab} />;
}

// import { headers } from "next/headers";
// import { notFound, redirect } from "next/navigation";
// import { CleaningShell } from "@/features/cleaning/components/cleaning-shell";
// import { loadCleaningPageData } from "@/features/cleaning/lib/load-cleaning-page";
// import { auth } from "@/lib/auth";
// import { db } from "@/lib/db";

// type Props = {
// 	params: Promise<{ slug: string }>;
// 	searchParams: Promise<{ tab?: string }>;
// };

// export default async function CleaningPage({ params, searchParams }: Props) {
// 	const { slug } = await params;
// 	const { tab: tabParam } = await searchParams;
// 	const session = await auth.api.getSession({
// 		headers: await headers(),
// 	});

// 	if (!session?.user) {
// 		notFound();
// 	}

// 	const membership = await db.organizationMembership.findFirst({
// 		where: {
// 			userId: session.user.id,
// 			organization: { slug },
// 		},
// 		select: {
// 			role: true,
// 			organization: {
// 				select: {
// 					id: true,
// 					slug: true,
// 					name: true,
// 					groups: {
// 						orderBy: { name: "asc" },
// 						select: {
// 							id: true,
// 							name: true,
// 							slug: true,
// 							superintendentId: true,
// 							assistantId: true,
// 							superintendent: {
// 								select: { id: true, name: true },
// 							},
// 							assistant: {
// 								select: { id: true, name: true },
// 							},
// 							members: {
// 								orderBy: { name: "asc" },
// 								select: { id: true, name: true },
// 							},
// 						},
// 					},
// 					people: {
// 						orderBy: { name: "asc" },
// 						select: {
// 							id: true,
// 							name: true,
// 							sex: true,
// 							young: true,
// 							baptized: true,
// 							familyId: true,
// 							groupId: true,
// 							headedFamily: {
// 								select: { id: true, name: true },
// 							},
// 							family: {
// 								select: { id: true, name: true },
// 							},
// 						},
// 					},
// 				},
// 			},
// 		},
// 	});

// 	if (!membership) {
// 		notFound();
// 	}

// 	const organization = membership.organization;

// 	const canManage = membership.role === "OWNER" || membership.role === "ADMIN";

// 	const tab =
// 		tabParam === "gerar" || tabParam === "tabela"
// 			? tabParam
// 			: canManage
// 				? "gerar"
// 				: "tabela";

// 	if (!canManage && tab === "gerar") {
// 		redirect(`/org/${slug}/cleaning?tab=tabela`);
// 	}

// 	const data = await loadCleaningPageData({
// 		organizationId: organization.id,
// 		organizationSlug: organization.slug,
// 		canManage,
// 		userId: session.user.id,
// 	});

// 	return <CleaningShell data={data} initialTab={tab} />;
// }
