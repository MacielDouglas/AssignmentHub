import "server-only";

import { toIsoDateOnly } from "@/features/meetings/application/services/meeting-week-dates";
import { db } from "@/lib/db";
import type { DutyPerson } from "./duty-types";

export type DutiesPageData = {
	organizationId: string;
	organizationSlug: string;
	organizationName: string;
	canManage: boolean;
	hasActiveSectors: boolean;
	sectors: Array<{
		key: "indicator" | "mic" | "sound" | "video" | "stage";
		active: boolean;
		count: number;
		posts: string[];
	}>;
	savedLists: Array<{
		id: string;
		periodFrom: string;
		periodTo: string;
		meetingsCount: number;
	}>;
	people: DutyPerson[];
};

export async function loadDutiesPageData(input: {
	organizationId: string;
	organizationSlug: string;
	organizationName: string;
	canManage: boolean;
}): Promise<DutiesPageData> {
	const [settings, lists, personRows] = await Promise.all([
		db.meetingDutySettings.findUnique({
			where: { organizationId: input.organizationId },
		}),
		db.meetingDutyList.findMany({
			where: { organizationId: input.organizationId },
			orderBy: { periodFrom: "desc" },
			take: 50,
			select: {
				id: true,
				periodFrom: true,
				periodTo: true,
				_count: { select: { dates: true } },
			},
		}),
		db.person.findMany({
			where: {
				organizationId: input.organizationId,
				isActive: true,
				sex: "MALE",
			},
			select: {
				id: true,
				name: true,
				attendant: true,
				roamingMic: true,
				sound: true,
				video: true,
				stage: true,
			},
			orderBy: { name: "asc" },
		}),
	]);

	const sectors: DutiesPageData["sectors"] = [
		{
			key: "indicator",
			active: settings?.indicatorActive ?? false,
			count: settings?.indicatorCount ?? 0,
			posts: settings?.indicatorSectors ?? [],
		},
		{
			key: "mic",
			active: settings?.micActive ?? false,
			count: settings?.micCount ?? 0,
			posts: [],
		},
		{
			key: "sound",
			active: settings?.soundActive ?? false,
			count: 1,
			posts: [],
		},
		{
			key: "video",
			active: settings?.videoActive ?? false,
			count: 1,
			posts: [],
		},
		{
			key: "stage",
			active: settings?.stageActive ?? false,
			count: 1,
			posts: [],
		},
	];

	return {
		organizationId: input.organizationId,
		organizationSlug: input.organizationSlug,
		organizationName: input.organizationName,
		canManage: input.canManage,
		hasActiveSectors: sectors.some((sector) => sector.active),
		sectors,
		savedLists: lists.map((list) => ({
			id: list.id,
			periodFrom: toIsoDateOnly(list.periodFrom),
			periodTo: toIsoDateOnly(list.periodTo),
			meetingsCount: list._count.dates,
		})),
		people: personRows.map((person) => ({
			id: person.id,
			name: person.name,
			indicator: person.attendant,
			mic: person.roamingMic,
			sound: person.sound,
			video: person.video,
			stage: person.stage,
		})),
	};
}
