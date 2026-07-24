import type { Metadata } from "next";

import { MeetingContentSectionStub } from "@/features/meeting-content/presentation/components/meeting-content-section-stub";

export const metadata: Metadata = {
	title: "Apostila · Conteúdo das Reuniões",
	description:
		"Guia de atividades da reunião do meio de semana (segunda a sexta).",
	robots: { index: false, follow: false },
};

export default function ApostilaPage() {
	return (
		<MeetingContentSectionStub
			badge="Meio de semana"
			title="Apostila"
			description="Importe o arquivo .jwpub da Guia de atividades (mwb) para cadastrar semanas, seções, partes, tempos e cânticos."
		/>
	);
}
