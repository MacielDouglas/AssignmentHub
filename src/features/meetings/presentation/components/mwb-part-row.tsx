"use client";

import { getMeetingPartMeta } from "@/features/meetings/domain/meeting-part-meta";
import type { MeetingPartDto } from "@/features/meetings/domain/meeting-types";
import type { MeetingAssignmentRole } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";
import {
	AssignmentDialog,
	type AssignmentSelection,
} from "./assignment-dialog";

type Props = {
	slug: string;
	part: MeetingPartDto;
	canManage: boolean;
	pendingSelections?: AssignmentSelection[];
	onSelect?: (selection: AssignmentSelection) => void;
};

function getPartDisplayTitle(part: MeetingPartDto) {
	if (!part.songNumber) return part.title;
	const songTitle = part.songTitle ? ` — ${part.songTitle}` : "";
	return `Cântico ${part.songNumber}${songTitle}`;
}

function getAssignableRoles(part: MeetingPartDto): MeetingAssignmentRole[] {
	const meta = getMeetingPartMeta(part.kind);
	if (!meta?.roles[0]) return [];

	if (part.kind === "MIDWEEK_CHAIRMAN") return ["CHAIRMAN"];

	return meta.roles;
}

function getAssignmentForRole(
	part: MeetingPartDto,
	role: MeetingAssignmentRole,
) {
	return part.assignments.find((a) => a.role === role);
}

function getPendingForRole(
	pendingSelections: AssignmentSelection[] | undefined,
	partId: string,
	role: MeetingAssignmentRole,
): AssignmentSelection | undefined {
	return pendingSelections?.find((s) => s.partId === partId && s.role === role);
}

const ROLE_LABELS: Record<MeetingAssignmentRole, string> = {
	PRIMARY: "Principal",
	CHAIRMAN: "Presidente",
	READER: "Leitor",
	ASSISTANT: "Ajudante",
	PRAYER: "Oração",
	SPEAKER: "Orador",
	CONDUCTOR: "Dirigente",
};

export function MwbPartRow({
	slug,
	part,
	canManage,
	pendingSelections,
	onSelect,
}: Props) {
	const assignableRoles = getAssignableRoles(part);
	const isAssignable = assignableRoles.length > 0;
	const hasMultipleRoles = assignableRoles.length > 1;

	return (
		<article
			className={cn(
				"flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors",
				canManage && "hover:bg-muted/50",
				part.isDisabled && "opacity-50",
			)}
		>
			<div className="min-w-0 flex-1">
				<p className="truncate text-body-sm text-foreground">
					{getPartDisplayTitle(part)}
				</p>
				{part.theme && !part.songNumber ? (
					<p className="mt-0.5 truncate text-caption text-muted-foreground">
						{part.theme}
					</p>
				) : null}
			</div>

			<div className="flex shrink-0 items-center gap-1">
				{part.durationMin != null ? (
					<span className="text-caption tabular-nums text-muted-foreground">
						{part.durationMin} min
					</span>
				) : null}

				{isAssignable && canManage ? (
					<div className="flex flex-col items-end gap-0.5">
						{assignableRoles.map((role) => {
							const pending = getPendingForRole(
								pendingSelections,
								part.id,
								role,
							);
							const assignment = getAssignmentForRole(part, role);
							const displayName =
								pending?.assigneeName ?? assignment?.assigneeName ?? null;
							const isPending = !!pending;

							return (
								<AssignmentDialog
									key={role}
									slug={slug}
									partId={part.id}
									partTitle={part.title}
									assignmentRole={role}
									onSelect={onSelect}
									autoClose={!hasMultipleRoles}
									trigger={
										<button
											type="button"
											className={cn(
												"max-w-32 rounded-md px-1.5 py-0.5 text-right text-caption transition",
												displayName
													? cn(
															"font-medium underline decoration-dotted underline-offset-2 hover:decoration-solid",
															isPending ? "text-primary" : "text-foreground",
														)
													: "text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground hover:decoration-solid",
											)}
										>
											<span className="block truncate">
												{displayName ?? ROLE_LABELS[role]}
											</span>
										</button>
									}
								/>
							);
						})}
					</div>
				) : (
					<div className="flex flex-col items-end gap-0.5">
						{assignableRoles.map((role) => {
							const pending = getPendingForRole(
								pendingSelections,
								part.id,
								role,
							);
							const assignment = getAssignmentForRole(part, role);
							const displayName =
								pending?.assigneeName ?? assignment?.assigneeName ?? null;

							if (!displayName) return null;

							return (
								<span
									key={role}
									className="max-w-32 truncate text-caption font-medium text-foreground"
								>
									{displayName}
								</span>
							);
						})}
					</div>
				)}
			</div>
		</article>
	);
}
