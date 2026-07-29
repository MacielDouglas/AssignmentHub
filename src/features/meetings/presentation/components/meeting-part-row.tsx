"use client";

import type { MeetingPartDto } from "../../domain/meeting-types";
import { AssignmentDialog } from "./assignment-dialog";

type Props = {
	slug: string;
	part: MeetingPartDto;
	startTime: string | null;
	canManage: boolean;
};

export function MeetingPartRow({ slug, part, startTime, canManage }: Props) {
	const isChairman = part.kind === "MIDWEEK_CHAIRMAN";

	if (isChairman) {
		return <ChairmanRow slug={slug} part={part} canManage={canManage} />;
	}

	const primaryAssignment = part.assignments.find(
		(a) => a.role !== "ASSISTANT",
	);
	const assistantAssignment = part.assignments.find(
		(a) => a.role === "ASSISTANT",
	);
	const hasPrimary = Boolean(primaryAssignment?.assigneeName);
	const hasAssistant = Boolean(assistantAssignment?.assigneeName);

	const displayTitle = part.songNumber
		? `Cântico ${part.songNumber}${part.songTitle ? ` - ${part.songTitle}` : ""}`
		: part.title;

	return (
		<div>
			<p>É o que tem aqui: {startTime}</p>
			{/* Desktop & Mobile share same layout now */}
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-center gap-3 min-w-0 flex-wrap">
					{startTime ? (
						<span className="font-normal shrink-0">{startTime}</span>
					) : null}
					<span className="text-title wrap-break-words">{displayTitle}</span>
					{part.theme && !part.songNumber ? (
						<span className="text-body-sm text-muted-foreground wrap-break-words">
							{part.theme}
						</span>
					) : null}
					{part.durationMin != null ? (
						<span className="text-caption text-muted-foreground/60 whitespace-nowrap">
							- {part.durationMin} mins
						</span>
					) : null}
				</div>

				{/* Right side names */}
				<div className="flex flex-col items-end shrink-0">
					{primaryAssignment ? (
						<AssignmentDialog
							slug={slug}
							partId={part.id}
							partTitle={part.title}
							assignmentRole={primaryAssignment.role}
							trigger={
								<button
									type="button"
									className="text-label text-foreground underline decoration-dotted underline-offset-2 whitespace-nowrap"
								>
									{hasPrimary
										? primaryAssignment.assigneeName
										: "Não designado"}
								</button>
							}
						/>
					) : (
						<NonAssignableAssignments
							assignments={part.assignments}
							canManage={canManage}
						/>
					)}
					{hasAssistant ? (
						<span className="text-caption text-muted-foreground whitespace-nowrap">
							{assistantAssignment?.assigneeName}
						</span>
					) : null}
				</div>
			</div>
		</div>
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
	const hasName = Boolean(assignment?.assigneeName);

	return (
		<div className="flex items-center justify-between">
			<span className="text-label font-medium text-foreground">Presidente</span>
			{canManage ? (
				<AssignmentDialog
					slug={slug}
					partId={part.id}
					partTitle={part.title}
					assignmentRole="CHAIRMAN"
					trigger={
						<button
							type="button"
							className="text-label text-right text-foreground underline decoration-dotted underline-offset-2 hover:decoration-solid"
						>
							{hasName ? assignment.assigneeName : "Não designado"}
						</button>
					}
				/>
			) : (
				<span className="text-label text-right text-muted-foreground">
					{hasName ? assignment.assigneeName : "Não designado"}
				</span>
			)}
		</div>
	);
}

function NonAssignableAssignments({
	assignments,
	canManage,
}: {
	assignments: MeetingPartDto["assignments"];
	canManage: boolean;
}) {
	if (assignments.length > 0) {
		return (
			<span className="text-label text-foreground">
				{assignments.map((a) => a.assigneeName).join(", ")}
			</span>
		);
	}

	return (
		<span className="text-label text-muted-foreground">
			{canManage ? "Não designado" : "Sem programação"}
		</span>
	);
}
