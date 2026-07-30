import type { MeetingPartDto } from "@/features/meetings/domain/meeting-types";
import { cn } from "@/lib/utils";
import { AssignmentDialog } from "./assignment-dialog";

type Props = {
	slug: string;
	part: MeetingPartDto;
	startTime: string | null;
	canManage: boolean;
};

export function MeetingPartRow({ slug, part, startTime, canManage }: Props) {
	if (part.kind === "MIDWEEK_CHAIRMAN") {
		return <ChairmanRow slug={slug} part={part} canManage={canManage} />;
	}

	const primaryAssignment = part.assignments.find(
		(assignment) => assignment.role !== "ASSISTANT",
	);

	const assistantAssignment = part.assignments.find(
		(assignment) => assignment.role === "ASSISTANT",
	);

	const title = getPartDisplayTitle(part);
	const assistantName = assistantAssignment?.assigneeName ?? null;

	return (
		<article
			className={cn(
				"rounded-2xl px-2 py-2.5 transition-colors sm:px-3",
				canManage && "hover:bg-muted/55",
				part.isDisabled && "opacity-60",
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<div className="flex items-start gap-2.5">
						{startTime ? (
							<time
								dateTime={startTime}
								className="mt-0.5 shrink-0 font-medium tabular-nums text-body-sm text-foreground"
							>
								{startTime}
							</time>
						) : null}

						<div className="min-w-0">
							<p className="wrap-break-word text-body-sm font-medium text-foreground">
								{title}
							</p>

							{part.theme && !part.songNumber ? (
								<p className="mt-0.5 wrap-break-word text-caption text-muted-foreground">
									{part.theme}
								</p>
							) : null}
						</div>
					</div>
				</div>

				<div className="flex min-w-0 shrink-0 flex-col items-end gap-0.5 text-right">
					<AssignmentValue
						slug={slug}
						part={part}
						assignment={primaryAssignment}
						canManage={canManage}
						fallbackLabel={canManage ? "Não designado" : "Sem programação"}
					/>

					{assistantName ? (
						<span className="max-w-36 truncate text-caption text-muted-foreground sm:max-w-52">
							{assistantName}
						</span>
					) : null}
				</div>
			</div>

			<div className="mt-1.5 flex items-center gap-2 pl-15.5">
				{part.durationMin != null ? (
					<span className="text-caption tabular-nums text-muted-foreground">
						{formatDuration(part.durationMin)}
					</span>
				) : null}

				{part.isDisabled ? (
					<span className="rounded-full bg-muted px-2 py-0.5 text-caption font-medium text-muted-foreground">
						Indisponível
					</span>
				) : null}
			</div>
		</article>
	);
}

function ChairmanRow({
	slug,
	part,
	canManage,
}: {
	slug: string;
	part: MeetingPartDto;
	canManage: boolean;
}) {
	const assignment = part.assignments[0];
	const assigneeName = assignment?.assigneeName ?? null;

	return (
		<article className="flex min-h-11 items-center justify-between gap-4 rounded-xl px-2 py-1.5 sm:px-3">
			<span className="text-label font-medium text-foreground">Presidente</span>

			<AssignmentValue
				slug={slug}
				part={part}
				assignment={assignment}
				canManage={canManage}
				fallbackLabel={canManage ? "Não designado" : "Sem programação"}
				roleFallback="CHAIRMAN"
			/>

			{assigneeName ? null : null}
		</article>
	);
}

function AssignmentValue({
	slug,
	part,
	assignment,
	canManage,
	fallbackLabel,
	roleFallback,
}: {
	slug: string;
	part: MeetingPartDto;
	assignment: MeetingPartDto["assignments"][number] | undefined;
	canManage: boolean;
	fallbackLabel: string;
	roleFallback?: "CHAIRMAN";
}) {
	const label = assignment?.assigneeName ?? fallbackLabel;
	const assignmentRole = assignment?.role ?? roleFallback;

	if (!canManage || !assignmentRole) {
		return (
			<span className="max-w-40 truncate text-label text-muted-foreground sm:max-w-56">
				{label}
			</span>
		);
	}

	return (
		<AssignmentDialog
			slug={slug}
			partId={part.id}
			partTitle={part.title}
			assignmentRole={assignmentRole}
			trigger={
				<button
					type="button"
					className="min-h-11 max-w-40 rounded-md px-1 text-right text-label text-foreground underline decoration-dotted underline-offset-4 transition hover:decoration-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:max-w-56"
					aria-label={`Alterar designação de ${part.title}. Atual: ${label}`}
				>
					<span className="block truncate">{label}</span>
				</button>
			}
		/>
	);
}

function getPartDisplayTitle(part: MeetingPartDto) {
	if (!part.songNumber) {
		return part.title;
	}

	const songTitle = part.songTitle ? ` — ${part.songTitle}` : "";

	return `Cântico ${part.songNumber}${songTitle}`;
}

function formatDuration(durationInMinutes: number) {
	const safeDuration = Math.max(0, durationInMinutes);

	return `${safeDuration} ${safeDuration === 1 ? "min" : "min"}`;
}

// "use client";

// import type { MeetingPartDto } from "../../domain/meeting-types";
// import { AssignmentDialog } from "./assignment-dialog";

// type Props = {
// 	slug: string;
// 	part: MeetingPartDto;
// 	startTime: string | null;
// 	canManage: boolean;
// };

// export function MeetingPartRow({ slug, part, startTime, canManage }: Props) {
// 	const isChairman = part.kind === "MIDWEEK_CHAIRMAN";

// 	if (isChairman) {
// 		return <ChairmanRow slug={slug} part={part} canManage={canManage} />;
// 	}

// 	const primaryAssignment = part.assignments.find(
// 		(a) => a.role !== "ASSISTANT",
// 	);
// 	const assistantAssignment = part.assignments.find(
// 		(a) => a.role === "ASSISTANT",
// 	);
// 	const hasPrimary = Boolean(primaryAssignment?.assigneeName);
// 	const hasAssistant = Boolean(assistantAssignment?.assigneeName);

// 	const displayTitle = part.songNumber
// 		? `Cântico ${part.songNumber}${part.songTitle ? ` - ${part.songTitle}` : ""}`
// 		: part.title;

// 	return (
// 		<div>
// 			<p>É o que tem aqui: {startTime}</p>
// 			{/* Desktop & Mobile share same layout now */}
// 			<div className="flex items-start justify-between gap-3">
// 				<div className="flex items-center gap-3 min-w-0 flex-wrap">
// 					{startTime ? (
// 						<span className="font-normal shrink-0">{startTime}</span>
// 					) : null}
// 					<span className="text-title wrap-break-words">{displayTitle}</span>
// 					{part.theme && !part.songNumber ? (
// 						<span className="text-body-sm text-muted-foreground wrap-break-words">
// 							{part.theme}
// 						</span>
// 					) : null}
// 					{part.durationMin != null ? (
// 						<span className="text-caption text-muted-foreground/60 whitespace-nowrap">
// 							- {part.durationMin} mins
// 						</span>
// 					) : null}
// 				</div>

// 				{/* Right side names */}
// 				<div className="flex flex-col items-end shrink-0">
// 					{primaryAssignment ? (
// 						<AssignmentDialog
// 							slug={slug}
// 							partId={part.id}
// 							partTitle={part.title}
// 							assignmentRole={primaryAssignment.role}
// 							trigger={
// 								<button
// 									type="button"
// 									className="text-label text-foreground underline decoration-dotted underline-offset-2 whitespace-nowrap"
// 								>
// 									{hasPrimary
// 										? primaryAssignment.assigneeName
// 										: "Não designado"}
// 								</button>
// 							}
// 						/>
// 					) : (
// 						<NonAssignableAssignments
// 							assignments={part.assignments}
// 							canManage={canManage}
// 						/>
// 					)}
// 					{hasAssistant ? (
// 						<span className="text-caption text-muted-foreground whitespace-nowrap">
// 							{assistantAssignment?.assigneeName}
// 						</span>
// 					) : null}
// 				</div>
// 			</div>
// 		</div>
// 	);
// }

// function ChairmanRow({
// 	slug,
// 	part,
// 	canManage,
// }: {
// 	slug: string;
// 	part: MeetingPartDto;
// 	canManage: boolean;
// }) {
// 	const assignment = part.assignments[0];
// 	const hasName = Boolean(assignment?.assigneeName);

// 	return (
// 		<div className="flex items-center justify-between">
// 			<span className="text-label font-medium text-foreground">Presidente</span>
// 			{canManage ? (
// 				<AssignmentDialog
// 					slug={slug}
// 					partId={part.id}
// 					partTitle={part.title}
// 					assignmentRole="CHAIRMAN"
// 					trigger={
// 						<button
// 							type="button"
// 							className="text-label text-right text-foreground underline decoration-dotted underline-offset-2 hover:decoration-solid"
// 						>
// 							{hasName ? assignment.assigneeName : "Não designado"}
// 						</button>
// 					}
// 				/>
// 			) : (
// 				<span className="text-label text-right text-muted-foreground">
// 					{hasName ? assignment.assigneeName : "Não designado"}
// 				</span>
// 			)}
// 		</div>
// 	);
// }

// function NonAssignableAssignments({
// 	assignments,
// 	canManage,
// }: {
// 	assignments: MeetingPartDto["assignments"];
// 	canManage: boolean;
// }) {
// 	if (assignments.length > 0) {
// 		return (
// 			<span className="text-label text-foreground">
// 				{assignments.map((a) => a.assigneeName).join(", ")}
// 			</span>
// 		);
// 	}

// 	return (
// 		<span className="text-label text-muted-foreground">
// 			{canManage ? "Não designado" : "Sem programação"}
// 		</span>
// 	);
// }
