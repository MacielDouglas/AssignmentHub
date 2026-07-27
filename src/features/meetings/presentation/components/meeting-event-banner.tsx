import {
	HiOutlineClock,
	HiOutlineExclamationTriangle,
	HiOutlineMapPin,
} from "react-icons/hi2";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Props = {
	title: string | null;
	date: string | null;
	time: string | null;
	location: string | null;
	notes: string | null;
	isCancelled: boolean;
	cancellationReason: string | null;
};

export function MeetingEventBanner({
	title,
	date,
	time,
	location,
	notes,
	isCancelled,
	cancellationReason,
}: Props) {
	if (!isCancelled && !title) {
		return null;
	}

	return (
		<Alert className="rounded-2xl border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-50">
			<HiOutlineExclamationTriangle className="h-4 w-4 text-amber-600 dark:text-amber-300" />
			<AlertTitle className="font-semibold">
				{isCancelled
					? (cancellationReason ?? "Reunião substituída por evento especial")
					: title}
			</AlertTitle>
			<AlertDescription className="mt-1 space-y-1.5 text-sm text-amber-900/90 dark:text-amber-100/90">
				{(date || time) && (
					<p className="inline-flex items-center gap-1.5">
						<HiOutlineClock className="h-3.5 w-3.5 shrink-0" />
						{date}
						{time ? ` às ${time}` : ""}
					</p>
				)}
				{location && (
					<p className="inline-flex items-center gap-1.5">
						<HiOutlineMapPin className="h-3.5 w-3.5 shrink-0" />
						{location}
					</p>
				)}
				{notes && <p>{notes}</p>}
			</AlertDescription>
		</Alert>
	);
}
