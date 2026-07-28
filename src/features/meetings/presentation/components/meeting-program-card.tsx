"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

import type {
	MeetingPartDto,
	MeetingProgramDto,
} from "../../domain/meeting-types";
import { MeetingPartRow } from "./meeting-part-row";

type SectionMeta = {
	label: string;
	index: number;
};

const SECTION_META: Record<string, SectionMeta> = {
	TREASURES: { label: "Tesouros Espirituais", index: 0 },
	MINISTRY: { label: "Ministério", index: 1 },
	LIVING: { label: "Vida Cristã", index: 2 },
	PUBLIC_TALK: { label: "Discurso Público", index: 3 },
	WATCHTOWER: { label: "Sentinela", index: 4 },
};

type Props = {
	slug: string;
	weekStart: string;
	weekEnd: string;
	program: MeetingProgramDto;
	canManage: boolean;
	variant: "midweek" | "weekend";
};

function groupPartsBySection(parts: MeetingPartDto[]): Array<{
	sectionCode: string | null;
	parts: MeetingPartDto[];
}> {
	const groups: Map<string | null, MeetingPartDto[]> = new Map();

	for (const part of parts) {
		const key = part.sectionCode ?? "__standalone__";
		const list = groups.get(key) ?? [];
		list.push(part);
		groups.set(key, list);
	}

	return [...groups.entries()]
		.map(([key, partList]) => ({
			sectionCode: key === "__standalone__" ? null : key,
			parts: partList,
		}))
		.sort((a, b) => {
			const aOrder = a.parts[0]?.sortOrder ?? 0;
			const bOrder = b.parts[0]?.sortOrder ?? 0;
			return aOrder - bOrder;
		});
}

function computeStartTimes(
	parts: MeetingPartDto[],
	baseTime: string | null,
): Map<string, string> {
	const map = new Map<string, string>();
	if (!baseTime) return map;

	const [h, m] = baseTime.split(":").map(Number);
	let minutes = h * 60 + m;

	const sorted = [...parts].sort((a, b) => a.sortOrder - b.sortOrder);

	for (const part of sorted) {
		const hrs = Math.floor(minutes / 60);
		const mins = minutes % 60;
		map.set(
			part.id,
			`${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`,
		);
		if (part.durationMin != null) {
			minutes += part.durationMin;
		}
	}

	return map;
}

const MIDWEEK_SECTION_KINDS: Record<
	string,
	{ label: string; partKinds: string[] }
> = {
	INTRODUCAO: {
		label: "Introdução",
		partKinds: ["MIDWEEK_OPENING_SONG", "MIDWEEK_INTRODUCTION"],
	},
	TREASURES: {
		label: "Tesouros Espirituais",
		partKinds: [
			"MIDWEEK_TREASURES_TALK",
			"MIDWEEK_SPIRITUAL_GEMS",
			"MIDWEEK_BIBLE_READING",
		],
	},
	MINISTRY: {
		label: "Ministério",
		partKinds: [
			"MIDWEEK_MINISTRY_INITIATING_CONVERSATION",
			"MIDWEEK_MINISTRY_CULTIVATING_INTEREST",
			"MIDWEEK_MINISTRY_MAKING_DISCIPLES",
			"MIDWEEK_MINISTRY_EXPLAINING_BELIEFS",
			"MIDWEEK_MINISTRY_TALK",
		],
	},
	LIVING: {
		label: "Vida Cristã",
		partKinds: [
			"MIDWEEK_MIDDLE_SONG",
			"MIDWEEK_LIVING_PART",
			"MIDWEEK_ORGANIZATION_ACCOMPLISHMENTS",
			"MIDWEEK_BIBLE_STUDY",
			"MIDWEEK_SERVICE_TALK",
		],
	},
	CONCLUSAO: {
		label: "Conclusão",
		partKinds: ["MIDWEEK_CONCLUSION", "MIDWEEK_CLOSING_SONG_AND_PRAYER"],
	},
};

type VisualSection = {
	label: string | null;
	parts: MeetingPartDto[];
};

function buildMidweekVisualSections(parts: MeetingPartDto[]): VisualSection[] {
	const standaloneKinds = new Set(["MIDWEEK_DAY", "MIDWEEK_CHAIRMAN"]);

	const byKind = new Map<string, MeetingPartDto[]>();
	for (const part of parts) {
		const list = byKind.get(part.kind) ?? [];
		list.push(part);
		byKind.set(part.kind, list);
	}

	const sections: VisualSection[] = [];

	for (const [, sectionDef] of Object.entries(MIDWEEK_SECTION_KINDS)) {
		const sectionParts: MeetingPartDto[] = [];
		for (const kind of sectionDef.partKinds) {
			const kindParts = byKind.get(kind);
			if (kindParts) sectionParts.push(...kindParts);
		}
		if (sectionParts.length > 0) {
			sectionParts.sort((a, b) => a.sortOrder - b.sortOrder);
			sections.push({ label: sectionDef.label, parts: sectionParts });
		}
	}

	const standaloneParts: MeetingPartDto[] = [];
	for (const kind of standaloneKinds) {
		const kindParts = byKind.get(kind);
		if (kindParts) standaloneParts.push(...kindParts);
	}

	const chairmanParts = standaloneParts.filter(
		(p) => p.kind === "MIDWEEK_CHAIRMAN",
	);

	const result: VisualSection[] = [];

	if (chairmanParts.length > 0) {
		chairmanParts.sort((a, b) => a.sortOrder - b.sortOrder);
		result.push({ label: null, parts: chairmanParts });
	}

	result.push(...sections);

	return result;
}

export function MeetingProgramCard({
	slug,
	program,
	canManage,
	variant,
}: Props) {
	const isMidweek = variant === "midweek";

	const startTimes = computeStartTimes(
		program.parts,
		isMidweek ? program.scheduledTime : null,
	);

	const renderPartRow = (part: MeetingPartDto) => (
		<MeetingPartRow
			key={part.id}
			slug={slug}
			part={part}
			startTime={startTimes.get(part.id) ?? null}
			canManage={canManage && !program.isCancelled && !part.isDisabled}
		/>
	);

	return (
		<section className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-border/40">
			<div className="relative flex items-center gap-3 border-b border-border/50 bg-gradient-to-b from-background to-muted/20 px-4 py-3.5 sm:px-5 sm:py-4">
				<div
					className={cn(
						"flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10",
						isMidweek
							? "bg-primary/10 text-primary"
							: "bg-muted text-muted-foreground",
					)}
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						className="h-4.5 w-4.5 sm:h-5 sm:w-5"
						stroke="currentColor"
						strokeWidth={2}
						aria-hidden="true"
					>
						{isMidweek ? (
							<>
								<path d="M3 12h3l2-5 3 11 3-8 2 5 3-3v6H3z" />
								<circle cx="19" cy="5" r="1.5" />
							</>
						) : (
							<>
								<circle cx="12" cy="12" r="9" />
								<path d="M12 8v8M8 12h8" />
							</>
						)}
					</svg>
				</div>
				<div className="min-w-0">
					<h2 className="text-headline text-foreground">
						{isMidweek ? "Meio de semana" : "Fim de semana"}
					</h2>
					{program.scheduledTime ? (
						<p className="text-caption text-muted-foreground">
							{program.scheduledTime}
						</p>
					) : null}
				</div>
			</div>

			<div className="space-y-5 p-4 sm:p-5">
				{program.isCancelled || program.specialEventTitle ? (
					<div className="rounded-2xl border border-border/60 bg-muted/30 px-3.5 py-3">
						<p className="text-title text-foreground">
							{program.isCancelled
								? (program.cancellationReason ??
									"Reunião substituída por evento especial")
								: program.specialEventTitle}
						</p>
						{(program.specialEventDate || program.specialEventTime) && (
							<p className="mt-1 text-body-sm text-muted-foreground">
								{program.specialEventDate}
								{program.specialEventTime
									? ` às ${program.specialEventTime}`
									: ""}
							</p>
						)}
						{program.specialEventLocation && (
							<p className="text-body-sm text-muted-foreground">
								{program.specialEventLocation}
							</p>
						)}
					</div>
				) : null}

				{isMidweek ? (
					<MidweekSections
						parts={program.parts}
						renderPartRow={renderPartRow}
					/>
				) : (
					<WeekendSections
						parts={program.parts}
						renderPartRow={renderPartRow}
					/>
				)}
			</div>
		</section>
	);
}

function SectionBadge({ index }: { index: number }) {
	return (
		<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-caption font-semibold text-primary sm:h-5 sm:w-5 sm:rounded-md">
			{String(index).padStart(2, "0")}
		</div>
	);
}

function MidweekSections({
	parts,
	renderPartRow,
}: {
	parts: MeetingPartDto[];
	renderPartRow: (part: MeetingPartDto) => ReactNode;
}) {
	const sections = buildMidweekVisualSections(parts);

	return (
		<div className="space-y-5">
			{sections.map((section, i) => (
				<div key={section.label ?? section.parts[0]?.id ?? i}>
					{section.label ? (
						<div className="mb-2.5 flex items-center gap-2.5">
							<SectionBadge index={i + 1} />
							<h3 className="text-label font-semibold uppercase tracking-wider text-muted-foreground">
								{section.label}
							</h3>
						</div>
					) : null}
					<div className="space-y-1.5">
						{section.parts.map((part) => renderPartRow(part))}
					</div>
				</div>
			))}
		</div>
	);
}

function WeekendSections({
	parts,
	renderPartRow,
}: {
	parts: MeetingPartDto[];
	renderPartRow: (part: MeetingPartDto) => ReactNode;
}) {
	const groups = groupPartsBySection(parts);
	let sectionCount = 0;

	return (
		<div className="space-y-5">
			{groups.map((group) => {
				const meta = group.sectionCode ? SECTION_META[group.sectionCode] : null;

				if (meta) {
					sectionCount++;
					return (
						<div key={group.sectionCode}>
							<div className="mb-2.5 flex items-center gap-2.5">
								<SectionBadge index={sectionCount} />
								<h3 className="text-label font-semibold uppercase tracking-wider text-muted-foreground">
									{meta.label}
								</h3>
							</div>
							<div className="space-y-1.5">
								{group.parts.map((part) => renderPartRow(part))}
							</div>
						</div>
					);
				}

				return (
					<div
						key={`standalone-${group.parts[0]?.sortOrder ?? 0}`}
						className="space-y-1.5"
					>
						{group.parts.map((part) => renderPartRow(part))}
					</div>
				);
			})}
		</div>
	);
}
