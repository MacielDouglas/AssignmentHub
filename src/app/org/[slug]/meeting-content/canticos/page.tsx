import type { Metadata } from "next";

import { MeetingContentSectionStub } from "@/features/meeting-content/presentation/components/meeting-content-section-stub";

export const metadata: Metadata = {
	title: "Cânticos · Conteúdo das Reuniões",
	description: "Catálogo de cânticos por idioma (sjj).",
	robots: { index: false, follow: false },
};

export default function CanticosPage() {
	return (
		<MeetingContentSectionStub
			badge="Catálogo global"
			title="Cânticos"
			description="Importe o livro de cânticos (.jwpub sjj) para cadastrar número e título em português e espanhol."
		/>
	);
}
