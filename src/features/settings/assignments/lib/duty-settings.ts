import "server-only";

import { db } from "@/lib/db";

export type DutySettingsView = {
	settingsId: string | null;
	indicatorActive: boolean;
	indicatorCount: number;
	indicatorSectors: string[];
	micActive: boolean;
	micCount: number;
	soundActive: boolean;
	videoActive: boolean;
	stageActive: boolean;
};

const DEFAULTS: Omit<DutySettingsView, "settingsId"> = {
	indicatorActive: false,
	indicatorCount: 2,
	indicatorSectors: [],
	micActive: false,
	micCount: 2,
	soundActive: false,
	videoActive: false,
	stageActive: false,
};

export async function loadDutySettingsView(
	organizationId: string,
): Promise<DutySettingsView> {
	const settings = await db.meetingDutySettings.findUnique({
		where: { organizationId },
	});

	if (!settings) {
		return { settingsId: null, ...DEFAULTS };
	}

	return {
		settingsId: settings.id,
		indicatorActive: settings.indicatorActive,
		indicatorCount: settings.indicatorCount,
		indicatorSectors: settings.indicatorSectors,
		micActive: settings.micActive,
		micCount: settings.micCount,
		soundActive: settings.soundActive,
		videoActive: settings.videoActive,
		stageActive: settings.stageActive,
	};
}
