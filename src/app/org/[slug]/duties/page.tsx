import { notFound, redirect } from "next/navigation";

import { requireOrgMember } from "@/features/cleaning/lib/require-org-member";
import { DutiesShell } from "@/features/duties/components/duties-shell";
import { loadDutiesPageData } from "@/features/duties/lib/load-duties-page";

type Props = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ tab?: string }>;
};

export default async function DutiesPage({ params, searchParams }: Props) {
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
		redirect(`/org/${slug}/duties?tab=tabela`);
	}

	const data = await loadDutiesPageData({
		organizationId: access.organization.id,
		organizationSlug: access.organization.slug,
		organizationName: access.organization.name,
		canManage,
	});

	return <DutiesShell data={data} initialTab={tab} />;
}
