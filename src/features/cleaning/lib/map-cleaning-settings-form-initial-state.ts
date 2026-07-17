import type {
	CleaningSettingsFormConfigMap,
	// CleaningSettingsFormState,
	SectorItem,
	TypeFormState,
} from "../domain/cleaning-settings.types";
import type {
	CleaningAssignmentMode,
	CleaningType,
	CleaningWeekday,
} from "../schemas/save-cleaning-settings.schema";
import { createSuggestedConfigMap } from "./cleaning-settings-defaults";

type QueryResult = {
	role: string;
	organization: {
		id: string;
		name: string;
		slug: string;
		cleaningSettings: {
			id: string;
			cleaningPerMeeting: boolean;
			weeklyCleaning: boolean;
			generalCleaning: boolean;
			configs: Array<{
				id: string;
				type: CleaningType;
				enabled: boolean;
				assignmentMode: CleaningAssignmentMode | null;
				notes: string | null;
				timesPerWeek: number | null;
				weekdays: Array<{
					weekday: CleaningWeekday;
					sortOrder: number;
				}>;
				dates: Array<{
					id: string;
					date: Date;
					label: string | null;
				}>;
				sectors: Array<{
					id: string;
					name: string;
					description: string | null;
					peopleRequired: number | null;
					allowYoung: boolean;
					sortOrder: number;
					isActive: boolean;
				}>;
			}>;
		} | null;
	};
} | null;

function createClientKey(type: CleaningType, sortOrder: number, id?: string) {
	return id ? `${type}-${id}` : `${type}-new-${sortOrder}`;
}

function mapSector(
	type: CleaningType,
	sector: {
		id: string;
		name: string;
		description: string | null;
		peopleRequired: number | null;
		allowYoung: boolean;
		sortOrder: number;
		isActive: boolean;
	},
): SectorItem {
	return {
		id: sector.id,
		clientKey: createClientKey(type, sector.sortOrder, sector.id),
		name: sector.name,
		description: sector.description ?? "",
		peopleRequired:
			sector.peopleRequired !== null ? String(sector.peopleRequired) : "",
		allowYoung: sector.allowYoung,
		sortOrder: sector.sortOrder,
		isActive: sector.isActive,
	};
}

function cloneConfig(config: TypeFormState): TypeFormState {
	return {
		...config,
		weekdays: [...config.weekdays],
		dates: [...config.dates],
		sectors: config.sectors.map((sector) => ({ ...sector })),
	};
}

function mergeConfig(
	base: TypeFormState,
	incoming: NonNullable<
		NonNullable<QueryResult>["organization"]["cleaningSettings"]
	>["configs"][number],
): TypeFormState {
	return {
		...cloneConfig(base),
		id: incoming.id,
		type: incoming.type,
		enabled: incoming.enabled,
		assignmentMode: incoming.assignmentMode,
		notes: incoming.notes ?? "",
		timesPerWeek:
			incoming.timesPerWeek !== null ? String(incoming.timesPerWeek) : "",
		weekdays: incoming.weekdays
			.slice()
			.sort((a, b) => a.sortOrder - b.sortOrder)
			.map((item) => item.weekday),
		dates: incoming.dates
			.slice()
			.sort((a, b) => a.date.getTime() - b.date.getTime())
			.map((item) => item.date.toISOString()),
		sectors: incoming.sectors
			.slice()
			.sort((a, b) => a.sortOrder - b.sortOrder)
			.map((sector) => mapSector(incoming.type, sector)),
	};
}

export function mapCleaningSettingsFormInitialState(
	membership: QueryResult,
): CleaningSettingsFormState {
	const defaults = createSuggestedConfigMap();
	const organizationId = membership?.organization.id ?? "";
	const settings = membership?.organization.cleaningSettings ?? null;

	const configs: CleaningSettingsFormConfigMap = {
		MEETING: cloneConfig(defaults.MEETING),
		WEEKLY: cloneConfig(defaults.WEEKLY),
		GENERAL: cloneConfig(defaults.GENERAL),
	};

	if (settings) {
		for (const config of settings.configs) {
			configs[config.type] = mergeConfig(defaults[config.type], config);
		}
	}

	return {
		organizationId,
		settingsId: settings?.id,
		cleaningPerMeeting: settings?.cleaningPerMeeting ?? false,
		weeklyCleaning: settings?.weeklyCleaning ?? false,
		generalCleaning: settings?.generalCleaning ?? false,
		configs,
		defaults,
	};
}
