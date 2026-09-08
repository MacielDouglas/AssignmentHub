"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { MeetingPartDto } from "@/features/meetings/domain/meeting-types";
import type { AssignmentSelection } from "./assignment-dialog";
import {
	MIDWEEK_SECTION_DEFINITIONS,
	type VisualSection,
} from "./meeting-program-card/meeting-program.constants";
import { MwbPartRow } from "./mwb-part-row";

function buildSections(parts: MeetingPartDto[]): VisualSection[] {
	const byKind = new Map<string, MeetingPartDto[]>();
	for (const part of parts) {
		const list = byKind.get(part.kind) ?? [];
		list.push(part);
		byKind.set(part.kind, list);
	}

	return MIDWEEK_SECTION_DEFINITIONS.reduce<VisualSection[]>(
		(sections, definition) => {
			const sectionParts = definition.partKinds
				.flatMap((kind) => byKind.get(kind) ?? [])
				.sort((a, b) => a.sortOrder - b.sortOrder);

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
	pendingSelections?: AssignmentSelection[];
	onSelect?: (selection: AssignmentSelection) => void;
};

export function MwbWeekParts({
	slug,
	parts,
	canManage,
	pendingSelections,
	onSelect,
}: PartsProps) {
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
								pendingSelections={pendingSelections}
								onSelect={onSelect}
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
			<div className="space-y-2">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
			<div className="space-y-2">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
			<div className="space-y-2">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
			<div className="space-y-2">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
		</div>
	);
}
