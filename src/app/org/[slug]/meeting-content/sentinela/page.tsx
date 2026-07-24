import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
	listWatchtowerPageData,
	WatchtowerSection,
} from "@/features/meeting-content";
import { getMeetingContentAccess } from "@/features/meeting-content/application/services/meeting-content-auth";

type Props = {
	params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
	title: "A Sentinela · Conteúdo das Reuniões",
	description:
		"Importe e gerencie estudos de A Sentinela com revisão assistida por IA.",
	robots: { index: false, follow: false },
};

export default async function SentinelaPage({ params }: Props) {
	const { slug } = await params;
	const access = await getMeetingContentAccess(slug);

	if (!access) {
		notFound();
	}

	const { items, counts, pendingJob } = await listWatchtowerPageData();

	return (
		<WatchtowerSection
			slug={slug}
			canManage={access.canManage}
			studies={items}
			counts={counts}
			pendingJob={pendingJob}
		/>
	);
}
