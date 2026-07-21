import "server-only";

import type { CleaningPageData } from "@/features/cleaning/lib/cleaning-page-data";
import type {
	EligiblePerson,
	FairnessHistory,
} from "@/features/cleaning/lib/roster-types";
import { loadCleaningSettingsView } from "@/features/settings/cleaning/lib/cleaning-settings";
import { formatDateInput } from "@/features/settings/lib/year-bounds";
import { loadWeeklyMeetingsView } from "@/features/settings/meetings/lib/meeting-schedule";
import { db } from "@/lib/db";

export type {
	CleaningPageData,
	SavedListSummary,
} from "@/features/cleaning/lib/cleaning-page-data";

function dateToIsoOrNull(d: Date | null | undefined): string | null {
	if (!d) return null;
	return d.toISOString();
}

export async function loadCleaningPageData(args: {
	organizationId: string;
	organizationSlug: string;
	organizationName: string;
	canManage: boolean;
	userId: string;
}): Promise<CleaningPageData> {
	const [
		cleaningSettings,
		weeklyMeetingsRaw,
		peopleRaw,
		history,
		savedLists,
		membershipUser,
	] = await Promise.all([
		loadCleaningSettingsView(args.organizationId),
		loadWeeklyMeetingsView(args.organizationId),
		db.person.findMany({
			where: {
				organizationId: args.organizationId,
				isActive: true,
				cleaning: true,
			},
			select: {
				id: true,
				name: true,
				sex: true,
				young: true,
				familyId: true,
				groupId: true,
				spouseId: true,
				headedFamily: { select: { id: true } },
			},
			orderBy: { name: "asc" },
		}),
		loadFairnessHistory(args.organizationId),
		db.cleaningAssignmentList.findMany({
			where: {
				organizationId: args.organizationId,
				status: "SAVED",
			},
			orderBy: { periodFrom: "desc" },
			take: 50,
			select: {
				id: true,
				cleaningType: true,
				periodFrom: true,
				periodTo: true,
				status: true,
				_count: { select: { dates: true } },
			},
		}),
		db.user.findUnique({
			where: { id: args.userId },
			select: { personId: true },
		}),
	]);

	const people: EligiblePerson[] = peopleRaw.map((p) => ({
		id: p.id,
		name: p.name,
		sex: p.sex,
		young: p.young,
		familyId: p.familyId ?? p.headedFamily?.id ?? null,
		groupId: p.groupId,
		spouseId: p.spouseId,
	}));

	const weeklyMeetings: CleaningPageData["weeklyMeetings"] = {
		current: {
			scheduleId: weeklyMeetingsRaw.current.scheduleId,
			effectiveFrom: dateToIsoOrNull(weeklyMeetingsRaw.current.effectiveFrom),
			effectiveUntil: dateToIsoOrNull(weeklyMeetingsRaw.current.effectiveUntil),
			slots: weeklyMeetingsRaw.current.slots.map((s) => ({
				weekday: s.weekday,
				time: s.time,
			})),
		},
		nextYear: {
			year: weeklyMeetingsRaw.nextYear.year,
			scheduleId: weeklyMeetingsRaw.nextYear.scheduleId,
			slots: weeklyMeetingsRaw.nextYear.slots.map((s) => ({
				weekday: s.weekday,
				time: s.time,
			})),
		},
	};

	return {
		organizationId: args.organizationId,
		organizationSlug: args.organizationSlug,
		organizationName: args.organizationName || "Congregação",
		canManage: args.canManage,
		currentPersonId: membershipUser?.personId ?? null,
		cleaningSettings,
		weeklyMeetings,
		people,
		history,
		savedLists: savedLists.map((l) => ({
			id: l.id,
			cleaningType: l.cleaningType,
			periodFrom: formatDateInput(l.periodFrom),
			periodTo: formatDateInput(l.periodTo),
			status: l.status,
			dayCount: l._count.dates,
		})),
	};
}

async function loadFairnessHistory(
	organizationId: string,
): Promise<FairnessHistory> {
	const since = new Date();
	since.setDate(since.getDate() - 90);

	const rows = await db.cleaningAssignmentSectorAssignment.findMany({
		where: {
			assignmentDate: {
				date: { gte: since },
				list: { organizationId, status: "SAVED" },
			},
		},
		select: {
			personId: true,
			sectorId: true,
			assignmentDate: { select: { date: true } },
		},
	});

	const history: FairnessHistory = {
		totalByPerson: {},
		sectorByPerson: {},
		datesByPerson: {},
	};

	for (const r of rows) {
		const date = formatDateInput(r.assignmentDate.date);
		history.totalByPerson[r.personId] =
			(history.totalByPerson[r.personId] ?? 0) + 1;
		if (!history.sectorByPerson[r.personId]) {
			history.sectorByPerson[r.personId] = {};
		}
		history.sectorByPerson[r.personId][r.sectorId] =
			(history.sectorByPerson[r.personId][r.sectorId] ?? 0) + 1;
		if (!history.datesByPerson[r.personId]) {
			history.datesByPerson[r.personId] = [];
		}
		history.datesByPerson[r.personId].push(date);
	}

	for (const id of Object.keys(history.datesByPerson)) {
		history.datesByPerson[id].sort();
	}

	return history;
}
