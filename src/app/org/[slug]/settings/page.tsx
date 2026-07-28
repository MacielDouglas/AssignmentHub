import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CleaningSettingsPanel } from "@/features/settings/cleaning/components/cleaning-settings-panel";
import { loadCleaningSettingsView } from "@/features/settings/cleaning/lib/cleaning-settings";
import { formatDateInput } from "@/features/settings/lib/year-bounds";
import { MeetingsSettingsPanel } from "@/features/settings/meetings/components/meetings-settings-panel";
import { loadWeeklyMeetingsView } from "@/features/settings/meetings/lib/meeting-schedule";
import {
	SPECIAL_EVENT_TYPES,
	type SpecialEventType,
} from "@/features/settings/meetings/lib/special-event-meta";
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

	const tEvents = await getTranslations("SpecialEventTypes");

	const specialEvents = specialSchedules.flatMap((schedule) =>
		schedule.occurrences.map((occ) => ({
			id: occ.id,
			type: schedule.type as (typeof SPECIAL_EVENT_TYPES)[number],
			typeLabel: tEvents(schedule.type as SpecialEventType),
			startDate: formatDateInput(occ.startDate),
			endDate: occ.endDate ? formatDateInput(occ.endDate) : null,
			time: occ.time,
			location: occ.location,
			notes: occ.notes,
			isAllDay: occ.isAllDay,
		})),
	);

	const cleaning = await loadCleaningSettingsView(membership.organization.id);

	const activeTab =
		tab === "cleaning" || tab === "assignments" || tab === "meetings"
			? tab
			: "meetings";

	return (
		<>
			{activeTab === "meetings" ? (
				<MeetingsSettingsPanel
					organizationSlug={membership.organization.slug}
					canEdit={canEdit}
					weekly={weekly}
					specialEvents={specialEvents}
				/>
			) : null}

			{activeTab === "cleaning" ? (
				<CleaningSettingsPanel
					organizationSlug={membership.organization.slug}
					canEdit={canEdit}
					cleaning={cleaning}
				/>
			) : null}

			{activeTab === "assignments" ? (
				<section className="rounded-[28px] border border-dashed border-border bg-card p-5 shadow-sm sm:p-6">
					<h2 className="text-title text-foreground">Designações</h2>
					<p className="mt-2 text-sm text-muted-foreground">Em breve.</p>
				</section>
			) : null}
		</>
	);
}
