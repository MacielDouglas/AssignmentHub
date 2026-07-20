import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { SettingsShell } from "@/features/settings/components/settings-shell";
import { loadWeeklyMeetingsView } from "@/features/settings/lib/meeting-schedule";
import {
	SPECIAL_EVENT_META,
	SPECIAL_EVENT_TYPES,
} from "@/features/settings/lib/special-event-meta";
import { formatDateInput } from "@/features/settings/lib/year-bounds";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type PageProps = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ tab?: string }>;
};

export default async function SettingsPage({
	params,
	searchParams,
}: PageProps) {
	const { slug } = await params;
	const { tab } = await searchParams;

	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session?.user) notFound();

	const membership = await db.organizationMembership.findFirst({
		where: {
			userId: session.user.id,
			organization: { slug },
		},
		select: {
			role: true,
			organization: {
				select: { id: true, slug: true, name: true },
			},
		},
	});

	if (!membership) notFound();

	const canEdit = membership.role === "OWNER" || membership.role === "ADMIN";

	const weekly = await loadWeeklyMeetingsView(membership.organization.id);

	const specialSchedules = await db.organizationSchedule.findMany({
		where: {
			organizationId: membership.organization.id,
			type: { in: [...SPECIAL_EVENT_TYPES] },
		},
		include: {
			occurrences: {
				orderBy: { startDate: "asc" },
			},
		},
	});

	const specialEvents = specialSchedules.flatMap((schedule) =>
		schedule.occurrences.map((occ) => ({
			id: occ.id,
			type: schedule.type as (typeof SPECIAL_EVENT_TYPES)[number],
			typeLabel:
				SPECIAL_EVENT_META[
					schedule.type as (typeof SPECIAL_EVENT_TYPES)[number]
				]?.label ?? schedule.title,
			startDate: formatDateInput(occ.startDate),
			endDate: occ.endDate ? formatDateInput(occ.endDate) : null,
			time: occ.time,
			location: occ.location,
			notes: occ.notes,
			isAllDay: occ.isAllDay,
		})),
	);

	const activeTab =
		tab === "cleaning" || tab === "assignments" || tab === "meetings"
			? tab
			: "meetings";

	return (
		<SettingsShell
			organizationSlug={membership.organization.slug}
			organizationName={membership.organization.name}
			canEdit={canEdit}
			activeTab={activeTab}
			weekly={weekly}
			specialEvents={specialEvents}
		/>
	);
}
