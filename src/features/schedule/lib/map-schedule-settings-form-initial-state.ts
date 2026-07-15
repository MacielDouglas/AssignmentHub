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
	return value ?? "";
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

	const allowedTypes = new Set(defaults.map((item) => item.type));

	const itemMap = new Map<
		ScheduleItemFormState["type"],
		ScheduleItemFormState
	>();

	for (const item of defaults) {
		itemMap.set(item.type, structuredClone(item));
	}

	for (const item of membership?.organization.schedules ?? []) {
		if (!allowedTypes.has(item.type)) {
			continue;
		}

		itemMap.set(item.type, {
			id: item.id,
			clientKey: createClientKey("schedule", item.id),
			type: item.type,
			mode: item.mode,
			title: item.title,
			description: item.description ?? "",
			isActive: item.isActive,
			weeklyRules: item.weeklyRules.map(mapWeeklyRule),
			occurrences: item.occurrences.map((occurrence) =>
				mapOccurrence(item.type, occurrence),
			),
		});
	}

	return {
		organizationId,
		leaders,
		items: Array.from(itemMap.values()),
		defaults,
	};
}
