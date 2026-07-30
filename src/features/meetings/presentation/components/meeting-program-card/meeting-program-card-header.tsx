import { HiOutlineBuildingOffice2 } from "react-icons/hi2";

import { cn } from "@/lib/utils";

type Props = {
	variant: "midweek" | "weekend";
	scheduledTime: string | null;
};

export function MeetingProgramCardHeader({ variant, scheduledTime }: Props) {
	const isMidweek = variant === "midweek";

	return (
		<header
			className={cn(
				"flex items-center gap-3 border-b border-border/50 px-5 py-4 sm:px-6 sm:py-5",
				isMidweek
					? "bg-linear-to-br from-primary/8 via-background to-background"
					: "bg-linear-to-br from-muted/60 via-background to-background",
			)}
		>
			<div
				aria-hidden="true"
				className={cn(
					"flex size-10 shrink-0 items-center justify-center rounded-2xl sm:size-11",
					isMidweek
						? "bg-primary text-primary-foreground shadow-sm"
						: "bg-muted-foreground/10 text-muted-foreground",
				)}
			>
				{isMidweek ? (
					<HiOutlineBuildingOffice2 className="size-5 sm:size-5.5" />
				) : (
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="none"
						className="size-5 sm:size-5.5"
						stroke="currentColor"
						strokeWidth={2}
					>
						<circle cx="12" cy="12" r="9" />
						<path d="M12 8v8M8 12h8" />
					</svg>
				)}
			</div>

			<div className="min-w-0">
				<h2 className="text-headline text-foreground">
					{isMidweek ? "Meio de semana" : "Fim de semana"}
				</h2>

				{scheduledTime ? (
					<p className="mt-0.5 text-caption text-muted-foreground">
						Início previsto às {scheduledTime}
					</p>
				) : (
					<p className="mt-0.5 text-caption text-muted-foreground">
						Horário ainda não definido
					</p>
				)}
			</div>
		</header>
	);
}
