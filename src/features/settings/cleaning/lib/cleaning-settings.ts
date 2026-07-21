import {
	DEFAULT_SECTORS,
	parseFollowVisit,
} from "@/features/settings/cleaning/lib/cleaning-defaults";
import { formatDateInput } from "@/features/settings/lib/year-bounds";
import type {
	CleaningAssignmentMode,
	CleaningType,
	Weekday,
} from "@/generated/prisma/client";
import { db } from "@/lib/db";

export type CleaningSectorView = {
	id: string;
	name: string;
	description: string | null;
	peopleRequired: number | null;
	allowYoung: boolean;
	targetSex: "MALE" | "FEMALE" | null;
	sortOrder: number;
	isActive: boolean;
	assignmentCount: number;
};

export type CleaningTypeView = {
	type: CleaningType;
	configId: string;
	enabled: boolean;
	assignmentMode: CleaningAssignmentMode | null;
	followVisitSuppression: boolean;
	weekdays: Weekday[];
	timesPerWeek: number | null;
	dates: Array<{ id: string; date: string; label: string | null }>;
	sectors: CleaningSectorView[];
	allowedModes: CleaningAssignmentMode[];
};

export type CleaningSettingsView = {
	settingsId: string;
	types: CleaningTypeView[];
};

const TYPE_ORDER: CleaningType[] = ["MEETING", "WEEKLY", "GENERAL"];

const ALLOWED_MODES: Record<CleaningType, CleaningAssignmentMode[]> = {
	MEETING: ["PERSON", "FAMILY", "GROUP"],
	WEEKLY: ["FAMILY", "GROUP"],
	GENERAL: ["FAMILY", "GROUP"],
};

async function ensureCleaningSettings(organizationId: string) {
	let settings = await db.organizationCleaningSettings.findUnique({
		where: { organizationId },
		include: {
			configs: {
				include: {
					sectors: {
						orderBy: { sortOrder: "asc" },
						include: {
							_count: { select: { assignments: true } },
						},
					},
					weekdays: { orderBy: { sortOrder: "asc" } },
					dates: { orderBy: { date: "asc" } },
				},
			},
		},
	});

	if (!settings) {
		settings = await db.organizationCleaningSettings.create({
			data: {
				organizationId,
				cleaningPerMeeting: false,
				weeklyCleaning: false,
				generalCleaning: false,
				configs: {
					create: TYPE_ORDER.map((type) => ({
						type,
						enabled: false,
						assignmentMode: type === "MEETING" ? "PERSON" : "GROUP",
						sectors: {
							create: DEFAULT_SECTORS[type].map((s) => ({
								name: s.name,
								description: s.description,
								peopleRequired: type === "MEETING" ? s.peopleRequired : null,
								allowYoung: s.allowYoung,
								targetSex: type === "MEETING" ? s.targetSex : null,
								sortOrder: s.sortOrder,
								isActive: true,
							})),
						},
					})),
				},
			},
			include: {
				configs: {
					include: {
						sectors: {
							orderBy: { sortOrder: "asc" },
							include: {
								_count: { select: { assignments: true } },
							},
						},
						weekdays: { orderBy: { sortOrder: "asc" } },
						dates: { orderBy: { date: "asc" } },
					},
				},
			},
		});
	} else {
		// Garante os 3 configs existem
		for (const type of TYPE_ORDER) {
			if (!settings.configs.some((c) => c.type === type)) {
				await db.cleaningTypeConfig.create({
					data: {
						settingsId: settings.id,
						type,
						enabled: false,
						assignmentMode: type === "MEETING" ? "PERSON" : "GROUP",
						sectors: {
							create: DEFAULT_SECTORS[type].map((s) => ({
								name: s.name,
								description: s.description,
								peopleRequired: type === "MEETING" ? s.peopleRequired : null,
								allowYoung: s.allowYoung,
								targetSex: type === "MEETING" ? s.targetSex : null,
								sortOrder: s.sortOrder,
								isActive: true,
							})),
						},
					},
				});
			}
		}

		settings = await db.organizationCleaningSettings.findUniqueOrThrow({
			where: { id: settings.id },
			include: {
				configs: {
					include: {
						sectors: {
							orderBy: { sortOrder: "asc" },
							include: {
								_count: { select: { assignments: true } },
							},
						},
						weekdays: { orderBy: { sortOrder: "asc" } },
						dates: { orderBy: { date: "asc" } },
					},
				},
			},
		});
	}

	return settings;
}

export async function loadCleaningSettingsView(
	organizationId: string,
): Promise<CleaningSettingsView> {
	const settings = await ensureCleaningSettings(organizationId);

	const types: CleaningTypeView[] = [];

	for (const type of TYPE_ORDER) {
		const config = settings.configs.find((c) => c.type === type);
		if (!config) {
			throw new Error(
				`CleaningTypeConfig ausente para ${type} na organização ${organizationId}`,
			);
		}

		types.push({
			type,
			configId: config.id,
			enabled: config.enabled,
			assignmentMode: config.assignmentMode,
			followVisitSuppression: parseFollowVisit(config.notes),
			weekdays: config.weekdays.map((w) => w.weekday),
			timesPerWeek: config.timesPerWeek,
			dates: config.dates.map((d) => ({
				id: d.id,
				date: formatDateInput(d.date),
				label: d.label,
			})),
			sectors: config.sectors.map((s) => ({
				id: s.id,
				name: s.name,
				description: s.description,
				peopleRequired: s.peopleRequired,
				allowYoung: s.allowYoung,
				targetSex: s.targetSex,
				sortOrder: s.sortOrder,
				isActive: s.isActive,
				assignmentCount: s._count.assignments,
			})),
			allowedModes: ALLOWED_MODES[type],
		});
	}

	return { settingsId: settings.id, types };
}

/** Restaura defaults que faltam (por nome), sem sobrescrever editados */
export async function restoreMissingDefaultSectors(
	configId: string,
	type: CleaningType,
) {
	const existing = await db.cleaningSector.findMany({
		where: { cleaningTypeConfigId: configId },
		select: { name: true },
	});
	const names = new Set(existing.map((e) => e.name.toLowerCase()));
	const maxSort =
		(
			await db.cleaningSector.aggregate({
				where: { cleaningTypeConfigId: configId },
				_max: { sortOrder: true },
			})
		)._max.sortOrder ?? -1;

	let sort = maxSort + 1;
	const toCreate = DEFAULT_SECTORS[type].filter(
		(d) => !names.has(d.name.toLowerCase()),
	);

	if (toCreate.length === 0) return 0;

	await db.cleaningSector.createMany({
		data: toCreate.map((s) => ({
			cleaningTypeConfigId: configId,
			name: s.name,
			description: s.description,
			peopleRequired: type === "MEETING" ? s.peopleRequired : null,
			allowYoung: s.allowYoung,
			targetSex: type === "MEETING" ? s.targetSex : null,
			sortOrder: sort++,
			isActive: true,
		})),
	});

	return toCreate.length;
}
