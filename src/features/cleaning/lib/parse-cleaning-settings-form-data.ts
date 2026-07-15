import type {
	CleaningAssignmentMode,
	CleaningType,
	CleaningWeekday,
	SaveCleaningSettingsInput,
} from "../schemas/save-cleaning-settings.schema";

type RawConfig = SaveCleaningSettingsInput["configs"][number];
type RawSector = RawConfig["sectors"][number];

const ORDERED_TYPES: CleaningType[] = ["MEETING", "WEEKLY", "GENERAL"];

function parseBoolean(value: FormDataEntryValue | null) {
	return value === "true";
}

function parseString(value: FormDataEntryValue | null) {
	return typeof value === "string" ? value.trim() : "";
}

function parseOptionalString(value: FormDataEntryValue | null) {
	const parsed = parseString(value);
	return parsed === "" ? undefined : parsed;
}

function parseNullableNumber(value: FormDataEntryValue | null) {
	if (typeof value !== "string" || value.trim() === "") {
		return null;
	}

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function ensureConfig(
	configMap: Map<CleaningType, RawConfig>,
	type: CleaningType,
): RawConfig {
	const existing = configMap.get(type);

	if (existing) {
		return existing;
	}

	const config: RawConfig = {
		type,
		enabled: false,
		assignmentMode: null,
		notes: "",
		timesPerWeek: null,
		weekdays: [],
		dates: [],
		sectors: [],
	};

	configMap.set(type, config);
	return config;
}

function ensureSector(config: RawConfig, index: number): RawSector {
	const existing = config.sectors[index];

	if (existing) {
		return existing;
	}

	const sector: RawSector = {
		id: undefined,
		name: "",
		description: "",
		peopleRequired: null,
		allowYoung: true,
		sortOrder: index,
		isActive: true,
	};

	config.sectors[index] = sector;
	return sector;
}

export function parseCleaningSettingsFormData(
	formData: FormData,
): SaveCleaningSettingsInput {
	const organizationId = parseString(formData.get("organizationId"));
	const settingsId = parseOptionalString(formData.get("settingsId"));

	const cleaningPerMeeting = parseBoolean(formData.get("cleaningPerMeeting"));
	const weeklyCleaning = parseBoolean(formData.get("weeklyCleaning"));
	const generalCleaning = parseBoolean(formData.get("generalCleaning"));

	const configMap = new Map<CleaningType, RawConfig>();

	for (const [key, rawValue] of formData.entries()) {
		const configMatch = key.match(/^configs\.(MEETING|WEEKLY|GENERAL)\.(.+)$/);

		if (!configMatch) {
			continue;
		}

		const type = configMatch[1] as CleaningType;
		const field = configMatch[2];
		const config = ensureConfig(configMap, type);

		if (field === "id") {
			config.id = parseOptionalString(rawValue);
			continue;
		}

		if (field === "enabled") {
			config.enabled = parseBoolean(rawValue);
			continue;
		}

		if (field === "assignmentMode") {
			const value = parseString(rawValue);
			config.assignmentMode = value ? (value as CleaningAssignmentMode) : null;
			continue;
		}

		if (field === "notes") {
			config.notes = parseString(rawValue);
			continue;
		}

		if (field === "timesPerWeek") {
			config.timesPerWeek = parseNullableNumber(rawValue);
			continue;
		}

		const weekdayMatch = field.match(/^weekdays\.(\d+)$/);
		if (weekdayMatch) {
			const value = parseString(rawValue);
			if (value) {
				config.weekdays.push(value as CleaningWeekday);
			}
			continue;
		}

		const dateMatch = field.match(/^dates\.(\d+)$/);
		if (dateMatch) {
			const value = parseString(rawValue);
			if (value) {
				const date = new Date(value);
				if (!Number.isNaN(date.getTime())) {
					config.dates.push(date);
				}
			}
			continue;
		}

		const sectorMatch = field.match(/^sectors\.(\d+)\.(.+)$/);
		if (!sectorMatch) {
			continue;
		}

		const sectorIndex = Number(sectorMatch[1]);
		const sectorField = sectorMatch[2];
		const sector = ensureSector(config, sectorIndex);

		if (sectorField === "id") {
			sector.id = parseOptionalString(rawValue);
			continue;
		}

		if (sectorField === "name") {
			sector.name = parseString(rawValue);
			continue;
		}

		if (sectorField === "description") {
			sector.description = parseString(rawValue);
			continue;
		}

		if (sectorField === "peopleRequired") {
			sector.peopleRequired = parseNullableNumber(rawValue);
			continue;
		}

		if (sectorField === "allowYoung") {
			sector.allowYoung = parseBoolean(rawValue);
			continue;
		}

		if (sectorField === "sortOrder") {
			sector.sortOrder = parseNullableNumber(rawValue) ?? sectorIndex;
			continue;
		}

		if (sectorField === "isActive") {
			sector.isActive = parseBoolean(rawValue);
		}
	}

	const configs = ORDERED_TYPES.map((type) => {
		const config = ensureConfig(configMap, type);

		const uniqueWeekdays = [...new Set(config.weekdays)];
		const uniqueDates = [
			...new Map(
				config.dates
					.sort((a, b) => a.getTime() - b.getTime())
					.map((date) => [date.toISOString(), date]),
			).values(),
		];

		const sectors = config.sectors
			.filter((sector): sector is RawSector => Boolean(sector))
			.map((sector, index) => ({
				...sector,
				id: sector.id || undefined,
				description: sector.description ?? "",
				sortOrder: index,
			}));

		return {
			...config,
			weekdays: uniqueWeekdays,
			dates: uniqueDates,
			sectors,
		};
	}) as SaveCleaningSettingsInput["configs"];

	return {
		organizationId,
		settingsId,
		cleaningPerMeeting,
		weeklyCleaning,
		generalCleaning,
		configs,
	};
}
