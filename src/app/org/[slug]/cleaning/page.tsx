// src/app/org/[slug]/cleaning/page.tsx
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { CleaningPageContent } from "@/features/cleaning-list/components/cleaning-page-content";
import { getCleaningPageDataQuery } from "@/features/cleaning-list/queries/get-cleaning-page-data.query";
import { auth } from "@/lib/auth";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	return {
		title: `Limpeza | ${slug} | AssignmentHub`,
		description: "Gere e gerencie escalas de limpeza da organização.",
		robots: { index: false, follow: false },
	};
}

export default async function CleaningPage({ params }: Props) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) notFound();

	const { slug } = await params;
	const data = await getCleaningPageDataQuery({
		slug,
		userId: session.user.id,
	});
	if (!data) notFound();

	return <CleaningPageContent data={data} />;
}
