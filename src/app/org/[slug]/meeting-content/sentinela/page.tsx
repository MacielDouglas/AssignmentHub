import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listWatchtowerPageData } from "@/features/meeting-content";
import { getMeetingContentAccess } from "@/features/meeting-content/application/services/meeting-content-auth";
import { WatchtowerSection } from "@/features/meeting-content/presentation/components/watchtower-section";

type Props = {
	params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
	title: "A Sentinela | Conteúdo das Reuniões",
	description:
		"Importe e gerencie estudos de A Sentinela com revisão assistida.",
	robots: {
		index: false,
		follow: false,
	},
};

function toClientJSON<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

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
			studies={toClientJSON(items)}
			counts={toClientJSON(counts)}
			pendingJob={pendingJob ? toClientJSON(pendingJob) : null}
		/>
	);
}
