"use client";

import { getMeetingPartMeta } from "@/features/meetings/domain/meeting-part-meta";
import type { MeetingPartDto } from "@/features/meetings/domain/meeting-types";
import type { MeetingAssignmentRole } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";
import { AssignmentDialog } from "./assignment-dialog";

type Props = {
	slug: string;
	part: MeetingPartDto;
	canManage: boolean;
};

function getPartDisplayTitle(part: MeetingPartDto) {
	if (!part.songNumber) return part.title;
	const songTitle = part.songTitle ? ` — ${part.songTitle}` : "";
	return `Cântico ${part.songNumber}${songTitle}`;
}

function getAssignmentRole(part: MeetingPartDto): MeetingAssignmentRole | null {
	const meta = getMeetingPartMeta(part.kind);
	if (!meta?.roles[0]) return null;

	if (part.kind === "MIDWEEK_CHAIRMAN") return "CHAIRMAN";

	const existing = part.assignments[0];
	if (existing) return existing.role;

	return meta.roles[0];
}

export function MwbPartRow({ slug, part, canManage }: Props) {
	const meta = getMeetingPartMeta(part.kind);
	const role = getAssignmentRole(part);
	const isAssignable = meta && role;

	const existingAssignment = part.assignments[0];
	const displayName = existingAssignment?.assigneeName ?? null;

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
					<div className="flex items-center gap-1">
						<AssignmentDialog
							slug={slug}
							partId={part.id}
							partTitle={part.title}
							assignmentRole={role}
							trigger={
								<button
									type="button"
									className={cn(
										"max-w-32 rounded-md px-1.5 py-0.5 text-right text-caption transition",
										displayName
											? "font-medium text-foreground underline decoration-dotted underline-offset-2 hover:decoration-solid"
											: "text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground hover:decoration-solid",
									)}
								>
									<span className="block truncate">
										{displayName ?? "Designar"}
									</span>
								</button>
							}
						/>
					</div>
				) : displayName ? (
					<span className="max-w-32 truncate text-caption font-medium text-foreground">
						{displayName}
					</span>
				) : null}
			</div>
		</article>
	);
}
