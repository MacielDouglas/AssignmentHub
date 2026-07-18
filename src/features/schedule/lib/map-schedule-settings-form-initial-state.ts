import type {
	OccurrenceFormState,
	ScheduleItemFormState,
	ScheduleLeaderOption,
	ScheduleSettingsFormState,
	WeeklyRuleFormState,
} from "../domain/schedule-settings.types";
import { createDefaultScheduleItems } from "./schedule-settings-defaults";

type QueryResult = Awaited<
	ReturnType<
		typeof import("../queries/get-schedule-settings.query").getScheduleSettingsQuery
	>
>;

function toDateInput(value: Date | null | undefined) {
	if (!value) return "";
	return new Date(value).toISOString().slice(0, 10);
}

function toTimeInput(value: string | null | undefined) {
	if (!value) return "";
	const parts = value.split(":");
	if (parts.length >= 2) {
		return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
	}
	return value;
}

function createClientKey(prefix: string, id?: string, index?: number) {
	if (id) return `${prefix}-${id}`;
	return `${prefix}-${index ?? 0}`;
}

function mapWeeklyRule(rule: {
	id: string;
	weekday: WeeklyRuleFormState["weekday"];
	time: string;
	sortOrder: number;
}): WeeklyRuleFormState {
	return {
		id: rule.id,
		weekday: rule.weekday,
		time: rule.time,
		sortOrder: rule.sortOrder,
	};
}

function mapOccurrence(
	type: OccurrenceFormState["type"],
	occurrence: {
		id: string;
		startDate: Date;
		endDate: Date | null;
		time: string | null;
		isAllDay: boolean;
		leaderPersonId: string | null;
		location: string | null;
		notes: string | null;
		sortOrder: number;
	},
): OccurrenceFormState {
	return {
		id: occurrence.id,
		clientKey: createClientKey("occ", occurrence.id, occurrence.sortOrder),
		type,
		startDate: toDateInput(occurrence.startDate),
		endDate: toDateInput(occurrence.endDate),
		time: toTimeInput(occurrence.time),
		isAllDay: occurrence.isAllDay,
		leaderPersonId: occurrence.leaderPersonId ?? "",
		location: occurrence.location ?? "",
		notes: occurrence.notes ?? "",
		sortOrder: occurrence.sortOrder,
	};
}

function getEffectiveFromYear(value: Date | null | undefined) {
	if (!value) return null;
	return new Date(value).getUTCFullYear();
}

export function mapScheduleSettingsFormInitialState(
	membership: QueryResult,
): ScheduleSettingsFormState {
	const defaults = createDefaultScheduleItems();
	const organizationId = membership?.organization.id ?? "";

	const leaders: ScheduleLeaderOption[] =
		membership?.organization.people.map((person) => ({
			id: person.id,
			name: person.name,
		})) ?? [];

	const items: ScheduleItemFormState[] = [];

	for (const defaultItem of defaults) {
		if (defaultItem.type === "MEETINGS") {
			continue;
		}
		items.push(structuredClone(defaultItem));
	}

	const schedules = membership?.organization.schedules ?? [];

	const currentMeeting = schedules.find(
		(item) => item.type === "MEETINGS" && !item.effectiveFrom,
	);

	const nextYearMeeting = schedules.find(
		(item) => item.type === "MEETINGS" && Boolean(item.effectiveFrom),
	);

	if (currentMeeting) {
		items.unshift({
			id: currentMeeting.id,
			clientKey: createClientKey("schedule", currentMeeting.id),
			type: currentMeeting.type,
			variant: "DEFAULT",
			effectiveFromYear: null,
			mode: currentMeeting.mode,
			title: currentMeeting.title,
			description: currentMeeting.description ?? "",
			isActive: currentMeeting.isActive,
			weeklyRules: currentMeeting.weeklyRules.map(mapWeeklyRule),
			occurrences: currentMeeting.occurrences.map((occurrence) =>
				mapOccurrence(currentMeeting.type, occurrence),
			),
		});
	} else {
		const defaultCurrentMeeting = defaults.find(
			(item) => item.type === "MEETINGS" && item.variant === "DEFAULT",
		);

		if (defaultCurrentMeeting) {
			items.unshift(structuredClone(defaultCurrentMeeting));
		}
	}

	if (nextYearMeeting) {
		items.splice(1, 0, {
			id: nextYearMeeting.id,
			clientKey: createClientKey("schedule", nextYearMeeting.id),
			type: nextYearMeeting.type,
			variant: "NEXT_YEAR",
			effectiveFromYear: getEffectiveFromYear(nextYearMeeting.effectiveFrom),
			mode: nextYearMeeting.mode,
			title: nextYearMeeting.title,
			description: nextYearMeeting.description ?? "",
			isActive: nextYearMeeting.isActive,
			weeklyRules: nextYearMeeting.weeklyRules.map(mapWeeklyRule),
			occurrences: nextYearMeeting.occurrences.map((occurrence) =>
				mapOccurrence(nextYearMeeting.type, occurrence),
			),
		});
	}

	for (const schedule of schedules) {
		if (schedule.type === "MEETINGS") continue;

		const defaultItem = defaults.find(
			(item) => item.type === schedule.type && item.variant === "DEFAULT",
		);

		if (!defaultItem) continue;

		const index = items.findIndex(
			(item) => item.type === schedule.type && item.variant === "DEFAULT",
		);

		const mapped: ScheduleItemFormState = {
			id: schedule.id,
			clientKey: createClientKey("schedule", schedule.id),
			type: schedule.type,
			variant: "DEFAULT",
			effectiveFromYear: getEffectiveFromYear(schedule.effectiveFrom),
			mode: schedule.mode,
			title: schedule.title,
			description: schedule.description ?? "",
			isActive: schedule.isActive,
			weeklyRules: schedule.weeklyRules.map(mapWeeklyRule),
			occurrences: schedule.occurrences.map((occurrence) =>
				mapOccurrence(schedule.type, occurrence),
			),
		};

		if (index >= 0) {
			items[index] = mapped;
		} else {
			items.push(mapped);
		}
	}

	return {
		organizationId,
		leaders,
		items,
		defaults,
	};
}
