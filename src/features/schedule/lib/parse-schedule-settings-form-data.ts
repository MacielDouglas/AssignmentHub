import type {
	SaveScheduleSettingsInput,
	ScheduleItemInput,
	ScheduleMode,
	ScheduleOccurrenceInput,
	ScheduleType,
	ScheduleWeekday,
	ScheduleWeeklyRuleInput,
} from "../schemas/save-schedule-settings.schema";
import {
	ORGANIZATION_SCHEDULE_MODES,
	ORGANIZATION_SCHEDULE_TYPES,
	WEEKDAYS,
} from "../schemas/save-schedule-settings.schema";

type RawItem = {
	id?: string;
	type: ScheduleType;
	mode: ScheduleMode;
	title: string;
	description: string | null;
	isActive: boolean;
	weeklyRules: RawWeeklyRule[];
	occurrences: RawOccurrence[];
};

type RawWeeklyRule = {
	id?: string;
	weekday: ScheduleWeekday;
	time: string;
	sortOrder: number;
};

type RawOccurrence = {
	id?: string;
	type: ScheduleType;
	startDate: Date | null;
	endDate: Date | null;
	time: string | null;
	isAllDay: boolean;
	leaderPersonId: string | null;
	location: string | null;
	notes: string | null;
	sortOrder: number;
};

function parseBoolean(value: FormDataEntryValue | null) {
	return value === "true";
}

function parseString(value: FormDataEntryValue | null) {
	return typeof value === "string" ? value : "";
}

function parseNullableString(value: FormDataEntryValue | null) {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function parseDate(value: FormDataEntryValue | null) {
	if (typeof value !== "string" || value.trim() === "") {
		return null;
	}

	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
	if (typeof value !== "string" || value.trim() === "") {
		return fallback;
	}

	const parsed = Number(value);
	return Number.isNaN(parsed) ? fallback : parsed;
}

function isScheduleType(value: string): value is ScheduleType {
	return (ORGANIZATION_SCHEDULE_TYPES as readonly string[]).includes(value);
}

function isScheduleMode(value: string): value is ScheduleMode {
	return (ORGANIZATION_SCHEDULE_MODES as readonly string[]).includes(value);
}

function isWeekday(value: string): value is ScheduleWeekday {
	return (WEEKDAYS as readonly string[]).includes(value);
}

function ensureItem(itemMap: Map<number, RawItem>, index: number): RawItem {
	const existing = itemMap.get(index);

	if (existing) {
		return existing;
	}

	const next: RawItem = {
		type: "MEETINGS",
		mode: "SINGLE_DATETIME",
		title: "",
		description: null,
		isActive: false,
		weeklyRules: [],
		occurrences: [],
	};

	itemMap.set(index, next);
	return next;
}

function ensureWeeklyRule(item: RawItem, index: number): RawWeeklyRule {
	const existing = item.weeklyRules[index];

	if (existing) {
		return existing;
	}

	const next: RawWeeklyRule = {
		weekday: "MONDAY",
		time: "",
		sortOrder: index,
	};

	item.weeklyRules[index] = next;
	return next;
}

function ensureOccurrence(item: RawItem, index: number): RawOccurrence {
	const existing = item.occurrences[index];

	if (existing) {
		return existing;
	}

	const next: RawOccurrence = {
		type: item.type,
		startDate: null,
		endDate: null,
		time: null,
		isAllDay: false,
		leaderPersonId: null,
		location: null,
		notes: null,
		sortOrder: index,
	};

	item.occurrences[index] = next;
	return next;
}

function sortByOrder<T extends { sortOrder: number }>(value: T[]) {
	return [...value].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function parseScheduleSettingsFormData(
	formData: FormData,
): SaveScheduleSettingsInput {
	const organizationId = parseString(formData.get("organizationId"));
	const itemMap = new Map<number, RawItem>();

	for (const [key, rawValue] of formData.entries()) {
		const itemMatch = key.match(/^items\.(\d+)\.(.+)$/);

		if (!itemMatch) {
			continue;
		}

		const itemIndex = Number(itemMatch[1]);
		const field = itemMatch[2];
		const item = ensureItem(itemMap, itemIndex);

		if (field === "id") {
			const value = parseNullableString(rawValue);
			item.id = value ?? undefined;
			continue;
		}

		if (field === "type") {
			const value = parseString(rawValue);
			if (isScheduleType(value)) {
				item.type = value;
			}
			continue;
		}

		if (field === "mode") {
			const value = parseString(rawValue);
			if (isScheduleMode(value)) {
				item.mode = value;
			}
			continue;
		}

		if (field === "title") {
			item.title = parseString(rawValue);
			continue;
		}

		if (field === "description") {
			item.description = parseNullableString(rawValue);
			continue;
		}

		if (field === "isActive") {
			item.isActive = parseBoolean(rawValue);
			continue;
		}

		const weeklyRuleMatch = field.match(/^weeklyRules\.(\d+)\.(.+)$/);

		if (weeklyRuleMatch) {
			const ruleIndex = Number(weeklyRuleMatch[1]);
			const ruleField = weeklyRuleMatch[2];
			const rule = ensureWeeklyRule(item, ruleIndex);

			if (ruleField === "id") {
				const value = parseNullableString(rawValue);
				rule.id = value ?? undefined;
				continue;
			}

			if (ruleField === "weekday") {
				const value = parseString(rawValue);
				if (isWeekday(value)) {
					rule.weekday = value;
				}
				continue;
			}

			if (ruleField === "time") {
				rule.time = parseString(rawValue);
				continue;
			}

			if (ruleField === "sortOrder") {
				rule.sortOrder = parseNumber(rawValue, ruleIndex);
			}

			continue;
		}

		const occurrenceMatch = field.match(/^occurrences\.(\d+)\.(.+)$/);

		if (occurrenceMatch) {
			const occurrenceIndex = Number(occurrenceMatch[1]);
			const occurrenceField = occurrenceMatch[2];
			const occurrence = ensureOccurrence(item, occurrenceIndex);

			if (occurrenceField === "id") {
				const value = parseNullableString(rawValue);
				occurrence.id = value ?? undefined;
				continue;
			}

			if (occurrenceField === "type") {
				const value = parseString(rawValue);
				if (isScheduleType(value)) {
					occurrence.type = value;
				}
				continue;
			}

			if (occurrenceField === "startDate") {
				occurrence.startDate = parseDate(rawValue);
				continue;
			}

			if (occurrenceField === "endDate") {
				occurrence.endDate = parseDate(rawValue);
				continue;
			}

			if (occurrenceField === "time") {
				occurrence.time = parseNullableString(rawValue);
				continue;
			}

			if (occurrenceField === "isAllDay") {
				occurrence.isAllDay = parseBoolean(rawValue);
				continue;
			}

			if (occurrenceField === "leaderPersonId") {
				occurrence.leaderPersonId = parseNullableString(rawValue);
				continue;
			}

			if (occurrenceField === "location") {
				occurrence.location = parseNullableString(rawValue);
				continue;
			}

			if (occurrenceField === "notes") {
				occurrence.notes = parseNullableString(rawValue);
				continue;
			}

			if (occurrenceField === "sortOrder") {
				occurrence.sortOrder = parseNumber(rawValue, occurrenceIndex);
			}
		}
	}

	const items: SaveScheduleSettingsInput["items"] = Array.from(
		itemMap.entries(),
	)
		.sort(([a], [b]) => a - b)
		.map(
			([, item]): ScheduleItemInput => ({
				id: item.id,
				type: item.type,
				mode: item.mode,
				title: item.title,
				description: item.description,
				isActive: item.isActive,
				weeklyRules: sortByOrder(item.weeklyRules)
					.filter(
						(rule): rule is ScheduleWeeklyRuleInput =>
							Boolean(rule.weekday) && rule.time.trim().length > 0,
					)
					.map((rule, index) => ({
						id: rule.id,
						weekday: rule.weekday,
						time: rule.time,
						sortOrder: index,
					})),
				occurrences: sortByOrder(item.occurrences)
					.filter(
						(occurrence): occurrence is RawOccurrence & { startDate: Date } =>
							occurrence.startDate instanceof Date,
					)
					.map(
						(occurrence, index): ScheduleOccurrenceInput => ({
							id: occurrence.id,
							startDate: occurrence.startDate,
							endDate: occurrence.endDate,
							time: occurrence.time,
							isAllDay: occurrence.isAllDay,
							leaderPersonId: occurrence.leaderPersonId,
							location: occurrence.location,
							notes: occurrence.notes,
							sortOrder: index,
						}),
					),
			}),
		)
		.filter((item) => {
			if (item.type === "MEETINGS") {
				return true;
			}

			return item.isActive || item.occurrences.length > 0;
		});

	return {
		organizationId,
		items,
	};
}
