import type { MeetingPartDto } from "@/features/meetings/domain/meeting-types";

import { addMinutesToTime } from "./meeting-program.utils";

type Props = {
	parts: MeetingPartDto[];
	baseTime: string | null;
};

export function MidweekIntroductionSection({ parts, baseTime }: Props) {
	const chairman = parts.find((part) => part.kind === "MIDWEEK_CHAIRMAN");

	const openingSong = parts.find(
		(part) => part.kind === "MIDWEEK_OPENING_SONG",
	);

	const chairmanAssignment = chairman?.assignments[0];
	const openingSongTime = baseTime;
	const introductionTime = addMinutesToTime(baseTime, 5);

	return (
		<div className="space-y-2">
			<div className="flex min-h-11 items-center justify-between gap-4">
				<span className="text-label font-medium text-foreground">
					Presidente
				</span>

				{chairman ? (
					<span className="max-w-40 truncate text-label text-muted-foreground sm:max-w-56">
						{chairmanAssignment?.assigneeName ?? "Não designado"}
					</span>
				) : (
					<span className="text-label text-muted-foreground">
						Parte indisponível
					</span>
				)}
			</div>

			<ProgramInfoRow
				time={openingSongTime}
				duration="5 min"
				title={
					<>
						Cântico {openingSong?.songNumber ?? "—"}
						{openingSong?.songTitle ? ` — ${openingSong.songTitle}` : ""} e
						oração
					</>
				}
			/>

			<ProgramInfoRow
				time={introductionTime}
				duration="1 min"
				title="Introdução"
			/>
		</div>
	);
}

type ProgramInfoRowProps = {
	time: string | null;
	duration: string;
	title: React.ReactNode;
};

function ProgramInfoRow({ time, duration, title }: ProgramInfoRowProps) {
	return (
		<div className="flex min-h-8 items-start gap-3 text-body-sm text-foreground">
			<p className="min-w-0 flex-1">
				{time ? (
					<span className="font-medium tabular-nums">{time} </span>
				) : null}
				{title}
			</p>

			<span className="shrink-0 text-caption text-muted-foreground">
				{duration}
			</span>
		</div>
	);
}
