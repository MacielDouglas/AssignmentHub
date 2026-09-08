"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { MeetingPartDto } from "@/features/meetings/domain/meeting-types";
import { MwbPartRow } from "./mwb-part-row";

type VisualSection = {
	label: string | null;
	displayLabel?: string;
	color?: string;
	parts: MeetingPartDto[];
};

const MIDWEEK_SECTION_KINDS: Record<
	string,
	{ label: string; displayLabel?: string; color?: string; partKinds: string[] }
> = {
	INTRODUCAO: {
		label: "Introdução",
		partKinds: [
			"MIDWEEK_CHAIRMAN",
			"MIDWEEK_OPENING_SONG",
			"MIDWEEK_INTRODUCTION",
		],
	},
	TREASURES: {
		label: "Tesouros Espirituais",
		displayLabel: "TESOUROS DA PALAVRA DE DEUS",
		partKinds: [
			"MIDWEEK_TREASURES_TALK",
			"MIDWEEK_SPIRITUAL_GEMS",
			"MIDWEEK_BIBLE_READING",
		],
	},
	MINISTRY: {
		label: "Ministério",
		displayLabel: "FAÇA SEU MELHOR NO MINISTÉRIO",
		color: "#d68f00",
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
		displayLabel: "NOSSA VIDA CRISTÃ",
		color: "#bf2f13",
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

function buildSections(parts: MeetingPartDto[]): VisualSection[] {
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
			sections.push({
				label: sectionDef.label,
				displayLabel: sectionDef.displayLabel,
				color: sectionDef.color,
				parts: sectionParts,
			});
		}
	}
	return sections;
}

function SectionLabel({ label, color }: { label: string; color?: string }) {
	if (color) {
		return (
			<div className="flex items-center gap-2">
				<span
					className="h-px flex-1"
					style={{ backgroundColor: `${color}30` }}
				/>
				<span
					className="text-caption font-semibold uppercase tracking-wider"
					style={{ color }}
				>
					{label}
				</span>
				<span
					className="h-px flex-1"
					style={{ backgroundColor: `${color}30` }}
				/>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2">
			<span className="h-px flex-1 bg-border" />
			<span className="text-caption font-semibold uppercase tracking-wider text-primary">
				{label}
			</span>
			<span className="h-px flex-1 bg-border" />
		</div>
	);
}

type PartsProps = {
	slug: string;
	parts: MeetingPartDto[];
	canManage: boolean;
};

export function MwbWeekParts({ slug, parts, canManage }: PartsProps) {
	const sections = buildSections(parts);

	return (
		<div className="space-y-3">
			{sections.map((section, i) => (
				<div key={section.label ?? section.parts[0]?.id ?? i}>
					{section.label ? (
						<div className="mb-2">
							<SectionLabel
								label={section.displayLabel ?? section.label}
								color={section.color}
							/>
						</div>
					) : null}
					<div className="space-y-0.5">
						{section.parts.map((part) => (
							<MwbPartRow
								key={part.id}
								slug={slug}
								part={part}
								canManage={canManage}
							/>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

export function MwbWeekPartsSkeleton() {
	return (
		<div className="space-y-4">
			{Array.from({ length: 4 }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: skeleton - static list
				<div key={i} className="space-y-2">
					<Skeleton className="h-4 w-32" />
					{Array.from({ length: 3 }).map((_, j) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton - static list
						<Skeleton key={j} className="h-10 w-full" />
					))}
				</div>
			))}
		</div>
	);
}
