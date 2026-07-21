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
		organizationName: access.organization.name,
		canManage,
		userId: access.userId,
	});

	return <CleaningShell data={data} initialTab={tab} />;
}
