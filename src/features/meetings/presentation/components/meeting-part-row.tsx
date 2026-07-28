"use client";

import {
	HiOutlineCog6Tooth,
	HiOutlineEllipsisHorizontal,
	HiOutlineMusicalNote,
	HiOutlineUser,
} from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import type { MeetingAssignmentRole } from "@/generated/prisma/client";
import {
	getMeetingPartMeta,
	isAssignableMeetingPart,
} from "../../domain/meeting-part-meta";
import type { MeetingPartDto } from "../../domain/meeting-types";
import { AssignmentDialog } from "./assignment-dialog";

type Props = {
	slug: string;
	part: MeetingPartDto;
	startTime: string | null;
	canManage: boolean;
};

function roleLabel(role: MeetingAssignmentRole) {
	switch (role) {
		case "CHAIRMAN":
			return "Presidente";
		case "READER":
			return "Leitor";
		case "ASSISTANT":
			return "Ajudante";
		case "PRAYER":
			return "Oração";
		case "SPEAKER":
			return "Orador";
		case "CONDUCTOR":
			return "Dirigente";
		default:
			return "Designado";
	}
}

export function MeetingPartRow({ slug, part, startTime, canManage }: Props) {
	const assignable = isAssignableMeetingPart(part.kind) && !part.isDisabled;
	const meta = getMeetingPartMeta(part.kind);
	const roles = meta?.roles ?? [];

	const assignmentsByRole = new Map(
		part.assignments.map((assignment) => [assignment.role, assignment]),
	);

	return (
		<div className="group rounded-2xl border border-border/60 bg-card px-3 py-2.5 transition-all hover:border-border hover:bg-secondary/40 hover:shadow-sm sm:px-3.5 sm:py-3">
			<div className="grid grid-cols-[auto_1fr_auto] items-start gap-x-3 gap-y-1.5">
				{/* Column 1: start time badge */}
				<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary sm:h-8 sm:w-8 sm:rounded-[14px] sm:text-sm">
					{startTime ? (
						<span>{startTime}</span>
					) : (
						<HiOutlineEllipsisHorizontal className="h-3.5 w-3.5" />
					)}
				</div>

				{/* Column 2: info */}
				<div className="min-w-0 space-y-1">
					<div className="flex flex-wrap items-center gap-1.5">
						{part.songNumber ? (
							<span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2 py-0.5 text-caption font-medium text-primary">
								<HiOutlineMusicalNote className="h-2.5 w-2.5" />
								{part.songNumber}
							</span>
						) : null}
						{part.durationMin != null ? (
							<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-caption text-muted-foreground">
								{part.durationMin} min
							</span>
						) : null}
						{part.modality ? (
							<span className="rounded-full bg-muted px-2 py-0.5 text-caption text-muted-foreground">
								{part.modality}
							</span>
						) : null}
					</div>
					<h4 className="text-title text-foreground">{part.title}</h4>
					{part.theme ? (
						<p className="text-body-sm text-muted-foreground">{part.theme}</p>
					) : null}
					{part.songTitle && part.songNumber ? (
						<p className="text-caption text-muted-foreground/70">
							{part.songTitle}
						</p>
					) : null}
				</div>

				{/* Column 3: assignments */}
				<div className="col-span-full row-start-2 col-start-2 sm:col-span-1 sm:row-start-1 sm:col-start-3 sm:pt-0.5">
					{assignable && roles.length > 0 ? (
						<div className="flex flex-wrap gap-1.5 sm:flex-col">
							{roles.map((role) => {
								const assignment = assignmentsByRole.get(role);
								const hasName = Boolean(assignment?.assigneeName);

								return (
									<div
										key={role}
										className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-2.5 py-1.5 transition-colors hover:border-border"
									>
										<div className="min-w-0 max-w-24 sm:max-w-28">
											<p className="text-caption font-medium tracking-wide text-muted-foreground uppercase leading-tight">
												{roleLabel(role)}
											</p>
											<p className="flex items-center gap-1.5 truncate text-label text-foreground">
												<HiOutlineUser className="h-3 w-3 shrink-0 text-muted-foreground" />
												{assignment?.assigneeName || (
													<span className="text-muted-foreground/60">
														Sem designação
													</span>
												)}
											</p>
										</div>
										{canManage ? (
											<AssignmentDialog
												slug={slug}
												partId={part.id}
												partTitle={part.title}
												role={role}
												trigger={
													<Button
														type="button"
														variant={hasName ? "outline" : "default"}
														className="min-h-7 shrink-0 rounded-lg px-2.5 text-caption"
													>
														{hasName ? "Trocar" : "Designar"}
													</Button>
												}
											/>
										) : null}
									</div>
								);
							})}
						</div>
					) : (
						<>
							{!assignable && part.assignments.length > 0 ? (
								<div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 px-2.5 py-1.5">
									<HiOutlineUser className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
									<span className="truncate text-label text-foreground">
										{part.assignments.map((a) => a.assigneeName).join(", ")}
									</span>
								</div>
							) : null}
							{!assignable && part.assignments.length === 0 && !canManage ? (
								<div className="flex items-center gap-1.5 rounded-xl border border-dashed border-border/40 bg-muted/20 px-2.5 py-1.5">
									<HiOutlineCog6Tooth className="h-3.5 w-3.5 text-muted-foreground" />
									<span className="text-caption text-muted-foreground">
										Sem programação
									</span>
								</div>
							) : null}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
