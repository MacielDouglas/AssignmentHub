import type {
	MeetingPartDto,
	MeetingProgramDto,
} from "@/features/meetings/domain/meeting-types";

import { MeetingPartRow } from "../meeting-part-row";
import { computeStartTimes } from "./meeting-program.utils";
import { MeetingProgramCardHeader } from "./meeting-program-card-header";
import { MeetingProgramEventBanner } from "./meeting-program-event-banner";
import { MidweekSections } from "./midweek-sections";
import { WeekendSections } from "./weekend-sections";

export type MeetingProgramCardProps = {
	slug: string;
	program: MeetingProgramDto;
	canManage: boolean;
	variant: "midweek" | "weekend";
};

export function MeetingProgramCard({
	slug,
	program,
	canManage,
	variant,
}: MeetingProgramCardProps) {
	const isMidweek = variant === "midweek";

	const startTimes = computeStartTimes({
		parts: program.parts,
		baseTime: isMidweek ? program.scheduledTime : null,
	});

	function renderPartRow(part: MeetingPartDto) {
		const canManagePart = canManage && !program.isCancelled && !part.isDisabled;

		return (
			<MeetingPartRow
				key={part.id}
				slug={slug}
				part={part}
				startTime={startTimes.get(part.id) ?? null}
				canManage={canManagePart}
			/>
		);
	}

	return (
		<section
			aria-label={`Programação da reunião de ${
				isMidweek ? "meio de semana" : "fim de semana"
			}`}
			className="overflow-hidden rounded-[28px] bg-card shadow-sm ring-1 ring-border/40"
		>
			<MeetingProgramCardHeader
				variant={variant}
				scheduledTime={program.scheduledTime}
			/>

			<div className="space-y-6 p-5 sm:p-6">
				<MeetingProgramEventBanner program={program} />

				{isMidweek ? (
					<MidweekSections
						parts={program.parts}
						baseTime={program.scheduledTime}
						slug={slug}
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
