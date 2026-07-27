"use client";

import {
	HiOutlineClock,
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

export function MeetingPartRow({ slug, part, canManage }: Props) {
	const assignable = isAssignableMeetingPart(part.kind) && !part.isDisabled;
	const meta = getMeetingPartMeta(part.kind);
	const roles = meta?.roles ?? [];

	const assignmentsByRole = new Map(
		part.assignments.map((assignment) => [assignment.role, assignment]),
	);

	return (
		<div className="rounded-xl border border-gray-100 bg-white transition hover:border-gray-200">
			{/* 
				Mobile: 2-col grid (time | info), assignments full-width below 
				Desktop: 3-col grid (time | info | assignments) 
			*/}
			<div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0 p-3 sm:grid-cols-[auto_1fr_auto] sm:gap-3 sm:p-3.5">
				{/* Column 1: time/icon */}
				<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 sm:mt-0.5">
					{part.durationMin != null ? (
						<span className="text-xs font-bold">{part.durationMin}</span>
					) : (
						<HiOutlineEllipsisHorizontal className="h-4 w-4" />
					)}
				</div>

				{/* Column 2: info */}
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-1.5">
						{part.durationMin != null ? (
							<span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
								<HiOutlineClock className="h-2.5 w-2.5" />
								{part.durationMin} min
							</span>
						) : null}
						{part.modality ? (
							<span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
								{part.modality}
							</span>
						) : null}
						{part.songNumber ? (
							<span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
								<HiOutlineMusicalNote className="h-2.5 w-2.5" />
								{part.songNumber}
							</span>
						) : null}
					</div>
					<h4 className="mt-0.5 text-sm font-semibold text-gray-900">
						{part.title}
					</h4>
					{part.theme ? (
						<p className="text-xs text-gray-500">{part.theme}</p>
					) : null}
					{part.songTitle && part.songNumber ? (
						<p className="text-[11px] text-gray-400">{part.songTitle}</p>
					) : null}

					{/* Assignments (mobile only) */}
					{assignable && roles.length > 0 ? (
						<div className="mt-2 space-y-1.5 border-t border-gray-100 pt-2 sm:hidden">
							{roles.map((role) => {
								const assignment = assignmentsByRole.get(role);
								const hasName = Boolean(assignment?.assigneeName);

								return (
									<div
										key={role}
										className="flex items-center justify-between gap-2"
									>
										<div className="min-w-0 flex-1">
											<p className="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
												{roleLabel(role)}
											</p>
											<p className="flex items-center gap-1 truncate text-xs font-medium text-gray-700">
												<HiOutlineUser className="h-3 w-3 shrink-0 text-gray-400" />
												{assignment?.assigneeName || (
													<span className="text-gray-400">Sem designação</span>
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
														className="min-h-7 shrink-0 rounded-lg text-[11px]"
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
					) : null}
				</div>

				{/* Column 3: assignments (desktop only) */}
				<div className="hidden sm:block">
					{assignable && roles.length > 0 ? (
						<div className="space-y-1.5">
							{roles.map((role) => {
								const assignment = assignmentsByRole.get(role);
								const hasName = Boolean(assignment?.assigneeName);

								return (
									<div
										key={role}
										className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50/70 px-2.5 py-1.5"
									>
										<div className="min-w-0 flex-1">
											<p className="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
												{roleLabel(role)}
											</p>
											<p className="flex items-center gap-1 truncate text-xs font-medium text-gray-700">
												<HiOutlineUser className="h-3 w-3 shrink-0 text-gray-400" />
												{assignment?.assigneeName || (
													<span className="text-gray-400">Sem designação</span>
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
														className="min-h-7 shrink-0 rounded-lg text-[11px]"
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
								<div className="flex items-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50/70 px-2.5 py-1.5">
									<HiOutlineUser className="h-3.5 w-3.5 shrink-0 text-gray-400" />
									<span className="truncate text-xs font-medium text-gray-600">
										{part.assignments.map((a) => a.assigneeName).join(", ")}
									</span>
								</div>
							) : null}
							{!assignable && part.assignments.length === 0 && !canManage ? (
								<div className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-2.5 py-1.5">
									<HiOutlineCog6Tooth className="h-3.5 w-3.5 text-gray-300" />
									<span className="text-xs text-gray-400">Sem programação</span>
								</div>
							) : null}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
