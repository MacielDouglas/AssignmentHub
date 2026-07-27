import type { Metadata } from "next";

import { loadMeetingWeekQuery } from "@/features/meetings/application/queries/load-meeting-week.query";
import { MeetingsPageContent } from "@/features/meetings/presentation/components/meetings-page-content";

type Props = {
	params: Promise<{
		slug: string;
	}>;
	searchParams: Promise<{
		week?: string;
	}>;
};

export const metadata: Metadata = {
	title: "Reuniões",
	description: "Programação e designações das reuniões da congregação.",
	robots: {
		index: false,
		follow: false,
	},
};

export default async function MeetingsPage({ params, searchParams }: Props) {
	const { slug } = await params;
	const { week } = await searchParams;

	const data = await loadMeetingWeekQuery({
		slug,
		week,
	});

	return <MeetingsPageContent data={data} />;
}
