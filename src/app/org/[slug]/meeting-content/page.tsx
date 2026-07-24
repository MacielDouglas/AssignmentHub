import { redirect } from "next/navigation";

type Props = {
	params: Promise<{ slug: string }>;
};

export default async function MeetingContentIndexPage({ params }: Props) {
	const { slug } = await params;
	redirect(`/org/${slug}/meeting-content/apostila`);
}

// import type { Metadata } from "next";
// import { notFound } from "next/navigation";

// import {
// 	listWatchtowerPageData,
// 	WatchtowerSection,
// } from "@/features/meeting-content";
// import { getMeetingContentAccess } from "@/features/meeting-content/application/services/meeting-content-auth";

// type PageProps = {
// 	params: Promise<{ slug: string }>;
// };

// export const metadata: Metadata = {
// 	title: "A Sentinela | Conteúdo das Reuniões",
// 	description:
// 		"Importe estudos de A Sentinela a partir de arquivos .jwpub e revise antes de salvar.",
// 	robots: {
// 		index: false,
// 		follow: false,
// 		googleBot: { index: false, follow: false },
// 	},
// };

// export default async function MeetingContentWatchtowerPage({
// 	params,
// }: PageProps) {
// 	const { slug } = await params;

// 	const access = await getMeetingContentAccess(slug);
// 	if (!access) notFound();

// 	const { items, counts, pendingJob } = await listWatchtowerPageData();

// 	return (
// 		<main className="space-y-6">
// 			<WatchtowerSection
// 				slug={slug}
// 				canManage={access.canManage}
// 				studies={items}
// 				counts={counts}
// 				pendingJob={pendingJob}
// 			/>
// 		</main>
// 	);
// }
