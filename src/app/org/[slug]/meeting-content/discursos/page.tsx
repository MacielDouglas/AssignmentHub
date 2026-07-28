import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getMeetingContentAccess } from "@/features/meeting-content/application/services/meeting-content-auth";
import { listPublicTalksPageData } from "@/features/meeting-content/application/use-cases/list-public-talks-page-data";
import { PublicTalksSection } from "@/features/meeting-content/presentation/components/public-talks-section";

export const metadata: Metadata = {
	title: "Discursos públicos · Conteúdo das Reuniões",
	robots: { index: false, follow: false },
};

type Props = {
	params: Promise<{ slug: string }>;
};

/** Converte Date → string ISO e remove valores não JSON-safe para Client Components. */
function toClientJSON<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

export default async function DiscursosPage({ params }: Props) {
	const { slug } = await params;
	const access = await getMeetingContentAccess(slug);

	if (!access?.organizationId) {
		notFound();
	}

	const result = await listPublicTalksPageData(access.organizationId);
	// adapte se a função retornar shape diferente:
	const data = "data" in result ? result.data : result;
	const pendingJob =
		"pendingJob" in result ? (result.pendingJob ?? null) : null;

	return (
		<PublicTalksSection
			slug={slug}
			organizationId={access.organizationId}
			data={toClientJSON(data)}
			canManage={access.canManage}
			isSuperAdmin={Boolean(access.isSuperAdmin)}
			pendingJob={pendingJob ? toClientJSON(pendingJob) : null}
		/>
	);
}
