import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { listMwbPageData } from "@/features/meeting-content/application/services/list-mwb-page-data";
import { getMeetingContentAccess } from "@/features/meeting-content/application/services/meeting-content-auth";
import { MwbSection } from "@/features/meeting-content/presentation/components/mwb-section";

type Props = {
	params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
	title: "Apostila · Conteúdo das Reuniões",
	description:
		"Importe e gerencie a Guia de atividades da reunião do meio de semana.",
	robots: {
		index: false,
		follow: false,
	},
};

function toClientJSON<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

export default async function ApostilaPage({ params }: Props) {
	const { slug } = await params;
	const access = await getMeetingContentAccess(slug);

	if (!access) notFound();

	const { issues, counts, pendingJob } = await listMwbPageData();

	return (
		<MwbSection
			slug={slug}
			canManage={access.canManage}
			issues={toClientJSON(issues)}
			counts={toClientJSON(counts)}
			pendingJob={pendingJob ? toClientJSON(pendingJob) : null}
		/>
	);
}
