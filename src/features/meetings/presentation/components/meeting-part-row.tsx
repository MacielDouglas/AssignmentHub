"use client";

import {
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
	const isChairman = part.kind === "MIDWEEK_CHAIRMAN";

	if (isChairman) {
		return <ChairmanRow slug={slug} part={part} canManage={canManage} />;
	}

	const assignable = isAssignableMeetingPart(part.kind) && !part.isDisabled;
	const meta = getMeetingPartMeta(part.kind);
	const roles = meta?.roles ?? [];

	const assignmentsByRole = new Map(
		part.assignments.map((assignment) => [assignment.role, assignment]),
	);

	return (
		<div className="group rounded-2xl border border-border/60 bg-card px-3.5 py-3 transition-all hover:border-border hover:bg-secondary/40 hover:shadow-sm">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
				{/* Time badge */}
				{startTime ? (
					<div className="flex h-8 min-w-[2.75rem] shrink-0 items-center justify-center rounded-2xl bg-primary/10 px-1.5 text-[11px] font-semibold text-primary sm:h-9 sm:min-w-[3rem] sm:rounded-[14px] sm:px-2 sm:text-sm">
						{startTime}
					</div>
				) : null}

				{/* Content */}
				<div className="min-w-0 flex-1 space-y-2">
					{/* Metadata: tags */}
					<div className="flex flex-wrap items-center gap-1.5">
						{part.songNumber ? (
							<span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2 py-0.5 text-caption font-medium text-primary">
								<HiOutlineMusicalNote className="h-2.5 w-2.5" />
								{part.songNumber}
							</span>
						) : null}
						{part.durationMin != null ? (
							<span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-caption text-muted-foreground">
								{part.durationMin} min
							</span>
						) : null}
						{part.modality ? (
							<span className="rounded-full bg-muted px-2 py-0.5 text-caption text-muted-foreground">
								{part.modality}
							</span>
						) : null}
					</div>

					{/* Title */}
					<h4 className="text-title text-foreground">{part.title}</h4>

					{/* Theme */}
					{part.theme ? (
						<p className="text-body-sm text-muted-foreground">{part.theme}</p>
					) : null}

					{/* Song title */}
					{part.songTitle && part.songNumber ? (
						<p className="text-caption text-muted-foreground/70">
							{part.songTitle}
						</p>
					) : null}

					{/* Assignments */}
					{assignable && roles.length > 0 ? (
						<div className="flex flex-wrap gap-2 pt-1">
							{roles.map((role) => {
								const assignment = assignmentsByRole.get(role);
								const hasName = Boolean(assignment?.assigneeName);

								return (
									<div
										key={role}
										className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-1.5 transition-colors hover:border-border"
									>
										<HiOutlineUser className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
										<div className="min-w-0">
											<span className="text-caption font-medium tracking-wide text-muted-foreground uppercase leading-tight">
												{roleLabel(role)}
											</span>
											<span className="ml-1.5 truncate text-label text-foreground">
												{assignment?.assigneeName || (
													<span className="text-muted-foreground/60">
														Sem designação
													</span>
												)}
											</span>
										</div>
										{canManage ? (
											<AssignmentDialog
												slug={slug}
												partId={part.id}
												partTitle={part.title}
												assignmentRole={role}
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
						<NonAssignableAssignments
							assignments={part.assignments}
							canManage={canManage}
						/>
					)}
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
		<div className="group rounded-2xl border border-border/60 bg-card px-3.5 py-3 transition-all hover:border-border hover:bg-secondary/40 hover:shadow-sm">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2 min-w-0">
					<HiOutlineUser className="h-4 w-4 shrink-0 text-muted-foreground" />
					<span className="text-label font-medium text-foreground">
						Presidente
					</span>
					<span className="text-label text-muted-foreground">
						{hasName ? assignment.assigneeName : "Sem designação"}
					</span>
				</div>
				{canManage ? (
					<AssignmentDialog
						slug={slug}
						partId={part.id}
						partTitle={part.title}
						assignmentRole="CHAIRMAN"
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
			<div className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 px-2.5 py-1.5">
				<HiOutlineUser className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
				<span className="text-label text-foreground">
					{assignments.map((a) => a.assigneeName).join(", ")}
				</span>
			</div>
		);
	}

	if (!canManage) {
		return (
			<div className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-border/40 bg-muted/20 px-2.5 py-1.5">
				<HiOutlineEllipsisHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
				<span className="text-caption text-muted-foreground">
					Sem programação
				</span>
			</div>
		);
	}

	return null;
}
