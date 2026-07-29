"use client";

import type { MeetingWeekDto } from "../../domain/meeting-types";
import { MeetingProgramCard } from "./meeting-program-card";
import { WeekNavigation } from "./week-navigation";

type Props = {
	data: MeetingWeekDto;
	view: "midweek" | "weekend";
};

export function MeetingsPageContent({ data, view }: Props) {
	return (
		<>
			<section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
				<div className="border-b border-border/60 bg-muted/70 px-5 py-3 sm:px-6 sm:py-3.5">
					<div className="flex items-center gap-3">
						<div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-primary/10 text-primary">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								className="h-4.5 w-4.5"
								stroke="currentColor"
								strokeWidth={1.8}
								aria-hidden="true"
							>
								<rect x="3" y="4" width="18" height="18" rx="2" />
								<line x1="3" y1="10" x2="21" y2="10" />
								<line x1="8" y1="2" x2="8" y2="6" />
								<line x1="16" y1="2" x2="16" y2="6" />
							</svg>
						</div>
						<p className="text-label text-muted-foreground">
							{data.organizationName}
						</p>
					</div>
				</div>

				<div className="px-5 pb-4 pt-3.5 sm:px-6 sm:pb-5 sm:pt-4">
					<WeekNavigation
						slug={data.organizationSlug}
						weekStart={data.weekStart}
						weekEnd={data.weekEnd}
						locale={data.locale}
					/>
				</div>
			</section>

			<MeetingProgramCard
				slug={data.organizationSlug}
				weekStart={data.weekStart}
				weekEnd={data.weekEnd}
				program={view === "midweek" ? data.midweek : data.weekend}
				canManage={data.canManage}
				variant={view}
			/>
		</>
	);
}
