import type {
	OrganizationScheduleOccurrence,
	OrganizationScheduleType,
	Weekday,
} from "@/generated/prisma/client";

import { db } from "@/lib/db";

import { addDays, endOfWeekSunday } from "./meeting-week-dates";

type ResolvedEvent = {
	type: OrganizationScheduleType;
	title: string;
	occurrence: OrganizationScheduleOccurrence;
};

type MeetingSlot = {
	date: Date;
	time: string;
	weekday: Weekday;
};

type WeekScheduleResult = {
	midweek: MeetingSlot | null;
	weekend: MeetingSlot | null;
	blockingEvent: ResolvedEvent | null;
	specialMeeting: ResolvedEvent | null;
	celebration: ResolvedEvent | null;
	travelingOverseerVisit: ResolvedEvent | null;
};

const WEEKDAY_BY_JS: Record<number, Weekday> = {
	0: "SUNDAY",
	1: "MONDAY",
	2: "TUESDAY",
	3: "WEDNESDAY",
	4: "THURSDAY",
	5: "FRIDAY",
	6: "SATURDAY",
};

function isInEffectiveRange(
	date: Date,
	effectiveFrom: Date | null,
	effectiveUntil: Date | null,
) {
	const timestamp = date.getTime();

	if (effectiveFrom && timestamp < effectiveFrom.getTime()) {
		return false;
	}

	if (effectiveUntil && timestamp > effectiveUntil.getTime()) {
		return false;
	}

	return true;
}

function occurrenceIntersectsWeek(
	occurrence: Pick<OrganizationScheduleOccurrence, "startDate" | "endDate">,
	weekStart: Date,
	weekEnd: Date,
) {
	const endDate = occurrence.endDate ?? occurrence.startDate;

	return (
		occurrence.startDate.getTime() <= weekEnd.getTime() &&
		endDate.getTime() >= weekStart.getTime()
	);
}

function isMidweek(weekday: Weekday) {
	return (
		weekday === "MONDAY" ||
		weekday === "TUESDAY" ||
		weekday === "WEDNESDAY" ||
		weekday === "THURSDAY" ||
		weekday === "FRIDAY"
	);
}

export async function resolveOrganizationWeekSchedule(
	organizationId: string,
	weekStart: Date,
): Promise<WeekScheduleResult> {
	const weekEnd = endOfWeekSunday(weekStart);

	const schedules = await db.organizationSchedule.findMany({
		where: {
			organizationId,
			isActive: true,
			OR: [
				{
					type: "MEETINGS",
					mode: "WEEKLY_RECURRING",
				},
				{
					type: {
						in: [
							"SPECIAL_MEETING",
							"CELEBRATION",
							"TRAVELING_OVERSEER_VISIT",
							"CONVENTION",
							"CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER",
							"CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE",
						],
					},
				},
			],
		},
		include: {
			weeklyRules: {
				orderBy: {
					sortOrder: "asc",
				},
			},
			occurrences: {
				where: {
					startDate: {
						lte: weekEnd,
					},
					OR: [
						{
							endDate: null,
						},
						{
							endDate: {
								gte: weekStart,
							},
						},
					],
				},
				orderBy: [
					{
						startDate: "asc",
					},
					{
						sortOrder: "asc",
					},
				],
			},
		},
	});

	const weeklySchedules = schedules
		.filter(
			(schedule) =>
				schedule.type === "MEETINGS" &&
				schedule.mode === "WEEKLY_RECURRING" &&
				isInEffectiveRange(
					weekStart,
					schedule.effectiveFrom,
					schedule.effectiveUntil,
				),
		)
		.sort((a, b) => {
			const aFrom = a.effectiveFrom?.getTime() ?? 0;
			const bFrom = b.effectiveFrom?.getTime() ?? 0;

			return bFrom - aFrom;
		});

	const weeklySchedule = weeklySchedules[0];

	const slots: MeetingSlot[] =
		weeklySchedule?.weeklyRules.flatMap((rule) => {
			const targetWeekday = Object.entries(WEEKDAY_BY_JS).find(
				([, weekday]) => weekday === rule.weekday,
			);

			if (!targetWeekday) {
				return [];
			}

			const jsWeekday = Number(targetWeekday[0]);
			const mondayBasedOffset = jsWeekday === 0 ? 6 : jsWeekday - 1;
			const date = addDays(weekStart, mondayBasedOffset);

			return [
				{
					date,
					time: rule.time,
					weekday: rule.weekday,
				},
			];
		}) ?? [];

	const midweek = slots.find((slot) => isMidweek(slot.weekday)) ?? null;
	const weekend =
		slots.find(
			(slot) => slot.weekday === "SATURDAY" || slot.weekday === "SUNDAY",
		) ?? null;

	const specialEvents = schedules
		.filter((schedule) => schedule.type !== "MEETINGS")
		.flatMap((schedule) =>
			schedule.occurrences
				.filter((occurrence) =>
					occurrenceIntersectsWeek(occurrence, weekStart, weekEnd),
				)
				.map<ResolvedEvent>((occurrence) => ({
					type: schedule.type,
					title: schedule.title,
					occurrence,
				})),
		);

	const blockingEvent =
		specialEvents.find((event) => event.type === "CONVENTION") ??
		specialEvents.find(
			(event) =>
				event.type === "CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER" ||
				event.type === "CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE",
		) ??
		null;

	const specialMeeting =
		specialEvents.find((event) => event.type === "SPECIAL_MEETING") ?? null;

	const celebration =
		specialEvents.find((event) => event.type === "CELEBRATION") ?? null;

	const travelingOverseerVisit =
		specialEvents.find((event) => event.type === "TRAVELING_OVERSEER_VISIT") ??
		null;

	return {
		midweek,
		weekend,
		blockingEvent,
		specialMeeting,
		celebration,
		travelingOverseerVisit,
	};
}
