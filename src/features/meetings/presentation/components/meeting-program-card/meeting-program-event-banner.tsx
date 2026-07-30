import { HiOutlineExclamationTriangle, HiOutlineMapPin } from "react-icons/hi2";

import type { MeetingProgramDto } from "@/features/meetings/domain/meeting-types";

type Props = {
	program: MeetingProgramDto;
};

export function MeetingProgramEventBanner({ program }: Props) {
	const shouldRender = program.isCancelled || program.specialEventTitle;

	if (!shouldRender) {
		return null;
	}

	const title = program.isCancelled
		? (program.cancellationReason ??
			"Esta reunião foi substituída por um evento especial.")
		: program.specialEventTitle;

	const dateAndTime = [
		program.specialEventDate,
		program.specialEventTime ? `às ${program.specialEventTime}` : null,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<aside
			aria-label="Aviso sobre programação especial"
			className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4"
		>
			<div className="flex items-start gap-3">
				<HiOutlineExclamationTriangle
					aria-hidden="true"
					className="mt-0.5 size-5 shrink-0 text-amber-700"
				/>

				<div className="min-w-0">
					<p className="text-title font-medium text-amber-950">{title}</p>

					{dateAndTime ? (
						<p className="mt-1 text-body-sm text-amber-900/80">{dateAndTime}</p>
					) : null}

					{program.specialEventLocation ? (
						<p className="mt-1 flex items-center gap-1.5 text-body-sm text-amber-900/80">
							<HiOutlineMapPin aria-hidden="true" className="size-4 shrink-0" />
							{program.specialEventLocation}
						</p>
					) : null}
				</div>
			</div>
		</aside>
	);
}
