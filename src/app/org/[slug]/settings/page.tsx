import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AssignmentSettingsPanel } from "@/features/settings/assignments/components/assignment-settings-panel";
import { loadAssignmentSettingsView } from "@/features/settings/assignments/lib/assignment-settings";
import { CleaningSettingsPanel } from "@/features/settings/cleaning/components/cleaning-settings-panel";
import { loadCleaningSettingsView } from "@/features/settings/cleaning/lib/cleaning-settings";
import { formatDateInput } from "@/features/settings/lib/year-bounds";
import { MeetingsSettingsPanel } from "@/features/settings/meetings/components/meetings-settings-panel";
import { listDedicatedEvents } from "@/features/settings/meetings/lib/dedicated-events";
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

	const legacyEvents = specialSchedules.flatMap((schedule) =>
		schedule.occurrences.map((occ) => ({
			id: occ.id,
			source: "LEGACY" as const,
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

	// Tabelas dedicadas (Opção B) — leitura em paralelo com o legado (Fase 4:
	// escrita nova, leitura dupla até a migração total).
	const dedicated = await listDedicatedEvents(membership.organization.id);
	const dedicatedAsLegacy = dedicated.map((d) => ({
		// Talks dedicadas usam id real (edição dedicada); demais tipos seguem
		// mapeados como legado até ganharem form próprio.
		id: d.source === "SPECIAL_TALK" ? d.id : `${d.source}:${d.id}`,
		source: d.source,
		type: (d.source === "SPECIAL_TALK"
			? "SPECIAL_TALK"
			: "SPECIAL_MEETING") as (typeof SPECIAL_EVENT_TYPES)[number],
		typeLabel: d.typeLabel,
		startDate: d.startDate,
		endDate: d.endDate,
		time: d.time,
		location: d.location,
		notes: d.notes,
		isAllDay: false,
		theme: d.theme ?? null,
		speakerName: d.speakerName ?? null,
		speakerPersonId: d.speakerPersonId ?? null,
	}));

	const specialEvents = [...dedicatedAsLegacy, ...legacyEvents];

	// Oradores: pessoas ativas com discurso público (select de discurso especial).
	const speakerOptions = await db.person.findMany({
		where: {
			organizationId: membership.organization.id,
			isActive: true,
			servicePrivilege: { is: { publicTalk: true } },
		},
		select: { id: true, name: true },
		orderBy: { name: "asc" },
		take: 1000,
	});

	const cleaning = await loadCleaningSettingsView(membership.organization.id);
	const assignmentSettings = await loadAssignmentSettingsView(
		membership.organization.id,
	);

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
					speakers={speakerOptions}
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
				<AssignmentSettingsPanel
					organizationSlug={membership.organization.slug}
					canEdit={canEdit}
					settings={assignmentSettings}
				/>
			) : null}
		</>
	);
}
