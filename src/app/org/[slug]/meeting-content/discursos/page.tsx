import type { Metadata } from "next";

import { MeetingContentSectionStub } from "@/features/meeting-content/presentation/components/meeting-content-section-stub";

export const metadata: Metadata = {
	title: "Discursos públicos · Conteúdo das Reuniões",
	description: "Esboços de discursos públicos (S-34).",
	robots: { index: false, follow: false },
};

export default function DiscursosPage() {
	return (
		<MeetingContentSectionStub
			badge="Fim de semana"
			title="Discursos públicos"
			description="Importe o arquivo S-34 (.jwpub) para cadastrar número e tema dos discursos públicos."
		/>
	);
}
