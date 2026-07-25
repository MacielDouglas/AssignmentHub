import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMeetingContentAccess } from "@/features/meeting-content/application/services/meeting-content-auth";
import { PublicTalksSection } from "@/features/meeting-content/presentation/components/public-talks-section";
import { getPublicTalksSectionData } from "@/features/meeting-content/queries/get-public-talks-section-data.query";

export const metadata: Metadata = {
	title: "Discursos públicos · Conteúdo das Reuniões",
	description: "Esboços de discursos públicos (S-34).",
	robots: { index: false, follow: false },
};

type Props = {
	params: Promise<{ slug: string }>;
};

export default async function DiscursosPage({ params }: Props) {
	const { slug } = await params;
	const access = await getMeetingContentAccess(slug);

	if (!access?.organizationId) {
		notFound();
	}

	const data = await getPublicTalksSectionData({
		organizationId: access.organizationId,
	});

	return (
		<PublicTalksSection
			slug={slug}
			organizationId={access.organizationId}
			data={data}
			canManage={access.canManage}
			isSuperAdmin={access.isSuperAdmin}
		/>
	);
}
