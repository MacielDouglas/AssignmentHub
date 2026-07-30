import type { ReactNode } from "react";
import type { MeetingPartDto } from "@/features/meetings/domain/meeting-types";

import { groupPartsBySection } from "./meeting-program.utils";
import { SectionHeader } from "./section-header";

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
	parts: MeetingPartDto[];
	renderPartRow: (part: MeetingPartDto) => ReactNode;
};

export function WeekendSections({ parts, renderPartRow }: Props) {
	const groups = groupPartsBySection(parts);

	return (
		<div className="space-y-5">
			{groups.map((group) => {
				const meta = group.sectionCode ? SECTION_META[group.sectionCode] : null;

				if (meta) {
					return (
						<div key={group.sectionCode}>
							<div className="mb-3">
								<SectionHeader label={meta.label} />
							</div>
							<div className="space-y-2">
								{group.parts.map((part) => renderPartRow(part))}
							</div>
						</div>
					);
				}

				return (
					<div
						key={`standalone-${group.parts[0]?.sortOrder ?? 0}`}
						className="space-y-2"
					>
						{group.parts.map((part) => renderPartRow(part))}
					</div>
				);
			})}
		</div>
	);
}
