import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { listSongsPageData } from "@/features/meeting-content/application/services/list-songs-page-data";
import { getMeetingContentAccess } from "@/features/meeting-content/application/services/meeting-content-auth";
import { SongsSection } from "@/features/meeting-content/presentation/components/songs-section";

type Props = {
	params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
	title: "Cânticos · Conteúdo das Reuniões",
	description: "Catálogo de cânticos por idioma (sjj).",
	robots: { index: false, follow: false },
};

export default async function CanticosPage({ params }: Props) {
	const { slug } = await params;
	const access = await getMeetingContentAccess(slug);
	if (!access) notFound();

	const { items, counts, pendingJob } = await listSongsPageData();

	return (
		<SongsSection
			slug={slug}
			canManage={access.canManage}
			songs={items}
			counts={counts}
			pendingJob={pendingJob}
		/>
	);
}
