import type { MeetingPartDto } from "@/features/meetings/domain/meeting-types";

import {
	MIDWEEK_SECTION_DEFINITIONS,
	type VisualSection,
} from "./meeting-program.constants";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

type ComputeStartTimesInput = {
	parts: MeetingPartDto[];
	baseTime: string | null;
};

export function parseTimeToMinutes(time: string): number | null {
	const match = TIME_PATTERN.exec(time);

	if (!match) {
		return null;
	}

	const hours = Number(match[1]);
	const minutes = Number(match[2]);

	return hours * 60 + minutes;
}

export function formatMinutesAsTime(totalMinutes: number): string {
	const normalizedMinutes = ((totalMinutes % 1_440) + 1_440) % 1_440;

	const hours = Math.floor(normalizedMinutes / 60);
	const minutes = normalizedMinutes % 60;

	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
		2,
		"0",
	)}`;
}

export function addMinutesToTime(
	time: string | null,
	minutesToAdd: number,
): string | null {
	if (!time || !Number.isFinite(minutesToAdd)) {
		return null;
	}

	const totalMinutes = parseTimeToMinutes(time);

	if (totalMinutes === null) {
		return null;
	}

	return formatMinutesAsTime(totalMinutes + minutesToAdd);
}

export function computeStartTimes({
	parts,
	baseTime,
}: ComputeStartTimesInput): Map<string, string> {
	const startingMinutes = baseTime ? parseTimeToMinutes(baseTime) : null;

	if (startingMinutes === null) {
		return new Map();
	}

	const sortedParts = [...parts].sort(
		(first, second) => first.sortOrder - second.sortOrder,
	);

	const firstScheduledPart = sortedParts[4];
	const shouldOffsetOpening =
		firstScheduledPart?.assignments?.[0]?.role === "PRIMARY";

	let currentMinutes = startingMinutes + (shouldOffsetOpening ? 5 : 0);

	const startTimes = new Map<string, string>();

	for (const part of sortedParts) {
		startTimes.set(part.id, formatMinutesAsTime(currentMinutes));

		const duration = part.durationMin ?? 0;
		currentMinutes += Math.max(0, duration);
	}

	return startTimes;
}

export function groupPartsBySection(parts: MeetingPartDto[]): Array<{
	sectionCode: string | null;
	parts: MeetingPartDto[];
}> {
	const groups = new Map<string | null, MeetingPartDto[]>();

	for (const part of parts) {
		const sectionCode = part.sectionCode ?? null;
		const sectionParts = groups.get(sectionCode) ?? [];

		sectionParts.push(part);
		groups.set(sectionCode, sectionParts);
	}

	return [...groups.entries()]
		.map(([sectionCode, groupedParts]) => ({
			sectionCode,
			parts: [...groupedParts].sort(
				(first, second) => first.sortOrder - second.sortOrder,
			),
		}))
		.sort((first, second) => {
			const firstOrder = first.parts[0]?.sortOrder ?? Number.MAX_SAFE_INTEGER;
			const secondOrder = second.parts[0]?.sortOrder ?? Number.MAX_SAFE_INTEGER;

			return firstOrder - secondOrder;
		});
}

export function buildMidweekVisualSections(
	parts: MeetingPartDto[],
): VisualSection[] {
	const partsByKind = new Map<string, MeetingPartDto[]>();

	for (const part of parts) {
		const partsOfKind = partsByKind.get(part.kind) ?? [];
		partsOfKind.push(part);
		partsByKind.set(part.kind, partsOfKind);
	}

	return MIDWEEK_SECTION_DEFINITIONS.reduce<VisualSection[]>(
		(sections, definition) => {
			const sectionParts = definition.partKinds
				.flatMap((kind) => partsByKind.get(kind) ?? [])
				.sort((first, second) => first.sortOrder - second.sortOrder);

			if (sectionParts.length === 0) {
				return sections;
			}

			sections.push({
				label: definition.label,
				displayLabel: definition.displayLabel,
				color: definition.color,
				parts: sectionParts,
			});

			return sections;
		},
		[],
	);
}
