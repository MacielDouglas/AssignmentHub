// src/features/cleaning/lib/parse-cleaning-settings-form-data.ts
import type { SaveCleaningSettingsInput } from "../schemas/save-cleaning-settings.schema";
import { isBathroomSectorName } from "../schemas/save-cleaning-settings.schema";

type TargetSex = "MALE" | "FEMALE" | null;
type Weekday = NonNullable<SaveCleaningSettingsInput["weekly"]["weekday"]>;

const WEEKDAYS = [
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
	"SUNDAY",
] as const satisfies readonly Weekday[];

function str(v: FormDataEntryValue | null) {
	return typeof v === "string" ? v.trim() : "";
}

function bool(v: FormDataEntryValue | null) {
	return v === "true" || v === "on" || v === "1";
}

function num(v: FormDataEntryValue | null, fallback: number | null = null) {
	if (typeof v !== "string" || !v.trim()) return fallback;
	const n = Number(v);
	return Number.isFinite(n) ? n : fallback;
}

function parseTargetSex(raw: string, name: string): TargetSex {
	if (!isBathroomSectorName(name)) return null;
	if (raw === "MALE" || raw === "FEMALE") return raw;
	return null;
}

function parseWeekday(raw: string): Weekday | null {
	if (raw === "") return null;
	return (WEEKDAYS as readonly string[]).includes(raw)
		? (raw as Weekday)
		: null;
}

function parseSectors(formData: FormData, prefix: string) {
	const indexes = new Set<number>();

	for (const key of formData.keys()) {
		const m = key.match(new RegExp(`^${prefix}\\.sectors\\.(\\d+)\\.`));
		if (m) indexes.add(Number(m[1]));
	}

	return [...indexes]
		.sort((a, b) => a - b)
		.map((index) => {
			const p = `${prefix}.sectors.${index}`;
			const name = str(formData.get(`${p}.name`));
			const targetSexRaw = str(formData.get(`${p}.targetSex`));

			return {
				id: str(formData.get(`${p}.id`)) || undefined,
				name,
				description: str(formData.get(`${p}.description`)) || null,
				peopleRequired: num(formData.get(`${p}.peopleRequired`), null),
				allowYoung: bool(formData.get(`${p}.allowYoung`)),
				targetSex: parseTargetSex(targetSexRaw, name),
				sortOrder: num(formData.get(`${p}.sortOrder`), index) ?? index,
				isActive: formData.get(`${p}.isActive`) === "false" ? false : true,
			};
		});
}

function parseDates(formData: FormData, prefix: string) {
	const raw = formData.getAll(`${prefix}.dates`);
	return raw
		.map((v) => str(v))
		.filter(Boolean)
		.filter((v, i, arr) => arr.indexOf(v) === i);
}

export function parseCleaningSettingsFormData(
	formData: FormData,
): SaveCleaningSettingsInput {
	const organizationId = str(formData.get("organizationId"));

	const meetingMode = str(formData.get("meeting.assignmentMode"));
	const weeklyMode = str(formData.get("weekly.assignmentMode"));
	const generalMode = str(formData.get("general.assignmentMode"));
	const weekday = str(formData.get("weekly.weekday"));

	const meetingSectors = parseSectors(formData, "meeting").map((s) => ({
		...s,
		peopleRequired: meetingMode === "PERSON" ? (s.peopleRequired ?? 1) : null,
		allowYoung: meetingMode === "PERSON" ? s.allowYoung : true,
		targetSex: parseTargetSex(s.targetSex ?? "", s.name),
	}));

	return {
		organizationId,
		meeting: {
			id: str(formData.get("meeting.id")) || undefined,
			type: "MEETING",
			enabled: bool(formData.get("meeting.enabled")),
			assignmentMode:
				meetingMode === "PERSON" ||
				meetingMode === "FAMILY" ||
				meetingMode === "GROUP"
					? meetingMode
					: null,
			notes: str(formData.get("meeting.notes")) || null,
			weekday: null,
			dates: [],
			sectors: meetingSectors,
		},
		weekly: {
			id: str(formData.get("weekly.id")) || undefined,
			type: "WEEKLY",
			enabled: bool(formData.get("weekly.enabled")),
			assignmentMode:
				weeklyMode === "FAMILY" || weeklyMode === "GROUP" ? weeklyMode : null,
			notes: str(formData.get("weekly.notes")) || null,
			weekday: parseWeekday(weekday),
			dates: [],
			sectors: parseSectors(formData, "weekly").map((s) => ({
				...s,
				peopleRequired: s.peopleRequired ?? 1,
				allowYoung: true,
				targetSex: parseTargetSex(s.targetSex ?? "", s.name),
			})),
		},
		general: {
			id: str(formData.get("general.id")) || undefined,
			type: "GENERAL",
			enabled: bool(formData.get("general.enabled")),
			assignmentMode: generalMode === "GROUP" ? "GROUP" : null,
			notes: str(formData.get("general.notes")) || null,
			weekday: null,
			dates: parseDates(formData, "general"),
			sectors: parseSectors(formData, "general").map((s) => ({
				...s,
				peopleRequired: s.peopleRequired ?? 1,
				allowYoung: true,
				targetSex: parseTargetSex(s.targetSex ?? "", s.name),
			})),
		},
	};
}
