import type { ReactNode } from "react";
import type { MeetingPartDto } from "@/features/meetings/domain/meeting-types";
import { buildMidweekVisualSections } from "./meeting-program.utils";
import { MidweekIntroductionSection } from "./midweek-introduction-section";
import { SectionHeader } from "./section-header";

type Props = {
	parts: MeetingPartDto[];
	baseTime: string | null;
	slug: string;
	renderPartRow: (part: MeetingPartDto) => ReactNode;
};

export function MidweekSections({
	parts,
	baseTime,
	slug,
	renderPartRow,
}: Props) {
	const sections = buildMidweekVisualSections(parts);

	return (
		<div className="space-y-5">
			{sections.map((section, i) => {
				const isIntro = section.label === "Introdução";

				return (
					<div key={section.label ?? section.parts[0]?.id ?? i}>
						{section.label && !isIntro ? (
							<div className="mb-3">
								<SectionHeader
									label={section.displayLabel ?? section.label}
									color={section.color}
								/>
							</div>
						) : null}

						{isIntro ? (
							<MidweekIntroductionSection
								parts={section.parts}
								baseTime={baseTime}
								slug={slug}
							/>
						) : (
							<div className="space-y-1">
								{section.parts.map((part) => renderPartRow(part))}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
