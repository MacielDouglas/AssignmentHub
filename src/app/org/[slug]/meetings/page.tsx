import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { loadMeetingWeekQuery } from "@/features/meetings/application/queries/load-meeting-week.query";
import { MeetingsPageContent } from "@/features/meetings/presentation/components/meetings-page-content";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Props = {
	params: Promise<{
		slug: string;
	}>;
	searchParams: Promise<{
		week?: string;
		view?: string;
	}>;
};

export default async function MeetingsPage({ params, searchParams }: Props) {
	const { slug } = await params;
	const { week, view } = await searchParams;

	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session?.user) notFound();

	const membership = await db.organizationMembership.findFirst({
		where: {
			userId: session.user.id,
			organization: { slug },
		},
		select: { role: true },
	});

	if (!membership) notFound();

	const data = await loadMeetingWeekQuery({
		slug,
		week,
	});

	const activeView = view === "weekend" ? "weekend" : "midweek";

	return <MeetingsPageContent data={data} view={activeView} />;
}
