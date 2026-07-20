// src/features/cleaning/lib/map-cleaning-settings-form-initial-state.ts
import type { CleaningSettingsFormState } from "../domain/cleaning-settings.types";
import type { getCleaningSettingsQuery } from "../queries/get-cleaning-settings.query";
import {
	createDefaultTypeConfig,
	createEmptySector,
} from "./cleaning-settings-defaults";

type Data = NonNullable<Awaited<ReturnType<typeof getCleaningSettingsQuery>>>;

function mapConfig(
	type: "MEETING" | "WEEKLY" | "GENERAL",
	config: Data["organization"]["cleaningSettings"] extends infer S
		? S extends { configs: (infer C)[] }
			? C | undefined
			: undefined
		: undefined,
	lockedSectorIds: Set<string>,
) {
	const base = createDefaultTypeConfig(type);
	if (!config) return base;

	return {
		id: config.id,
		type,
		enabled: config.enabled,
		assignmentMode: (config.assignmentMode ?? base.assignmentMode) as never,
		notes: config.notes ?? "",
		weekday: (config.weekdays[0]?.weekday ?? "") as never,
		dates: config.dates.map((d) => d.date.toISOString().slice(0, 10)),
		sectors:
			config.sectors.length > 0
				? config.sectors.map((s, index) => ({
						id: s.id,
						clientKey: `sector-${s.id}`,
						name: s.name,
						description: s.description ?? "",
						peopleRequired: s.peopleRequired ?? 1,
						allowYoung: s.allowYoung,
						targetSex: (s.targetSex ?? "") as "" | "MALE" | "FEMALE",
						sortOrder: s.sortOrder ?? index,
						isActive: s.isActive,
						locked: lockedSectorIds.has(s.id),
					}))
				: [createEmptySector(0)],
	};
}

export function mapCleaningSettingsFormInitialState(
	data: Data,
): CleaningSettingsFormState {
	const settings = data.organization.cleaningSettings;
	const configs = settings?.configs ?? [];
	const byType = {
		MEETING: configs.find((c) => c.type === "MEETING"),
		WEEKLY: configs.find((c) => c.type === "WEEKLY"),
		GENERAL: configs.find((c) => c.type === "GENERAL"),
	};

	return {
		organizationId: data.organization.id,
		settingsId: settings?.id ?? null,
		canManage: data.canManage,
		organizationName: data.organization.name,
		organizationSlug: data.organization.slug,
		meeting: mapConfig("MEETING", byType.MEETING, data.lockedSectorIds),
		weekly: mapConfig("WEEKLY", byType.WEEKLY, data.lockedSectorIds),
		general: mapConfig("GENERAL", byType.GENERAL, data.lockedSectorIds),
	};
}
