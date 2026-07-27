"use client";

import { HiOutlineCalendar } from "react-icons/hi2";

import type {
	MeetingPartDto,
	MeetingProgramDto,
} from "../../domain/meeting-types";
import { MeetingPartRow } from "./meeting-part-row";

type SectionMeta = {
	label: string;
	bgColor: string;
};

const SECTION_META: Record<string, SectionMeta> = {
	TREASURES: {
		label: "Tesouros Espirituais",
		bgColor: "#3c7f8b",
	},
	MINISTRY: {
		label: "Ministério",
		bgColor: "#d68f00",
	},
	LIVING: {
		label: "Vida Cristã",
		bgColor: "#bf2f13",
	},
	PUBLIC_TALK: {
		label: "Discurso Público",
		bgColor: "#3c7f8b",
	},
	WATCHTOWER: {
		label: "Sentinela",
		bgColor: "#b8860b",
	},
};

type Props = {
	slug: string;
	weekStart: string;
	weekEnd: string;
	program: MeetingProgramDto;
	canManage: boolean;
	variant: "midweek" | "weekend";
};

function groupPartsBySection(parts: MeetingPartDto[]): Array<{
	sectionCode: string | null;
	parts: MeetingPartDto[];
}> {
	const groups: Map<string | null, MeetingPartDto[]> = new Map();

	for (const part of parts) {
		const key = part.sectionCode ?? "__standalone__";
		const list = groups.get(key) ?? [];
		list.push(part);
		groups.set(key, list);
	}

	return [...groups.entries()]
		.map(([key, partList]) => ({
			sectionCode: key === "__standalone__" ? null : key,
			parts: partList,
		}))
		.sort((a, b) => {
			const aOrder = a.parts[0]?.sortOrder ?? 0;
			const bOrder = b.parts[0]?.sortOrder ?? 0;
			return aOrder - bOrder;
		});
}

export function MeetingProgramCard({
	slug,
	program,
	canManage,
	variant,
}: Props) {
	const isMidweek = variant === "midweek";
	const groups = groupPartsBySection(program.parts);

	return (
		<section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
			<div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3 sm:px-5">
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-2.5">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								className="h-4 w-4"
								stroke="currentColor"
								strokeWidth={2}
								aria-hidden="true"
							>
								{isMidweek ? (
									<>
										<path d="M3 12h3l2-5 3 11 3-8 2 5 3-3v6H3z" />
										<circle cx="19" cy="5" r="1.5" />
									</>
								) : (
									<>
										<circle cx="12" cy="12" r="9" />
										<path d="M12 8v8M8 12h8" />
									</>
								)}
							</svg>
						</div>
						<div>
							<h2 className="text-sm font-semibold text-gray-900">
								{isMidweek ? "Meio de semana" : "Fim de semana"}
							</h2>
							{program.scheduledAt ? (
								<p className="flex items-center gap-1 text-xs text-gray-500">
									<HiOutlineCalendar className="h-3 w-3" />
									{program.scheduledAt}
									{program.scheduledTime ? ` · ${program.scheduledTime}` : ""}
								</p>
							) : null}
						</div>
					</div>
				</div>
			</div>

			<div className="space-y-4 p-4 sm:p-5">
				{program.isCancelled || program.specialEventTitle ? (
					<div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-amber-950">
						<p className="text-sm font-semibold">
							{program.isCancelled
								? (program.cancellationReason ??
									"Reunião substituída por evento especial")
								: program.specialEventTitle}
						</p>
						{(program.specialEventDate || program.specialEventTime) && (
							<p className="mt-0.5 text-xs text-amber-700">
								{program.specialEventDate}
								{program.specialEventTime
									? ` às ${program.specialEventTime}`
									: ""}
							</p>
						)}
						{program.specialEventLocation && (
							<p className="text-xs text-amber-700">
								{program.specialEventLocation}
							</p>
						)}
					</div>
				) : null}

				{groups.map((group) => {
					const meta = group.sectionCode
						? SECTION_META[group.sectionCode]
						: null;

					if (meta) {
						return (
							<div key={group.sectionCode}>
								<div className="mb-2 flex items-center gap-2">
									<div
										className="h-4 w-1 shrink-0 rounded-full"
										style={{ backgroundColor: meta.bgColor }}
									/>
									<h3 className="text-[11px] font-bold tracking-widest uppercase text-gray-400">
										{meta.label}
									</h3>
								</div>

								<div className="space-y-1">
									{group.parts.map((part) => (
										<MeetingPartRow
											key={part.id}
											slug={slug}
											part={part}
											canManage={
												canManage && !program.isCancelled && !part.isDisabled
											}
										/>
									))}
								</div>
							</div>
						);
					}

					return (
						<div
							key={`standalone-${group.parts[0]?.sortOrder ?? 0}`}
							className="space-y-1"
						>
							{group.parts.map((part) => (
								<MeetingPartRow
									key={part.id}
									slug={slug}
									part={part}
									canManage={
										canManage && !program.isCancelled && !part.isDisabled
									}
								/>
							))}
						</div>
					);
				})}
			</div>
		</section>
	);
}
