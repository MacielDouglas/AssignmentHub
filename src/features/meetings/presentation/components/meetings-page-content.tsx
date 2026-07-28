"use client";

import { useState } from "react";

import type { MeetingWeekDto } from "../../domain/meeting-types";
import { MeetingProgramCard } from "./meeting-program-card";
import { WeekNavigation } from "./week-navigation";

type Props = {
	data: MeetingWeekDto;
};

export function MeetingsPageContent({ data }: Props) {
	const [mobileTab, setMobileTab] = useState<"midweek" | "weekend">("midweek");

	return (
		<div className="mx-auto w-full max-w-7xl space-y-5 pb-24 md:pb-10">
			<header className="overflow-hidden rounded-4xl border border-border bg-card shadow-md ring-1 ring-border/30">
				<div className="border-b border-border bg-muted px-5 py-4 sm:px-6 sm:py-5">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								className="h-5 w-5"
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
						<div className="min-w-0">
							<p className="text-label text-muted-foreground">
								{data.organizationName}
							</p>
							<h1 className="text-headline text-foreground sm:text-lg">
								Reuniões
							</h1>
						</div>
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
			</header>

			{/* Mobile tabs */}
			<div className="flex rounded-4xl border border-border bg-muted p-0.5 sm:hidden">
				<button
					type="button"
					onClick={() => setMobileTab("midweek")}
					className={[
						"min-h-9 flex-1 rounded-lg text-sm font-medium transition-all",
						mobileTab === "midweek"
							? "bg-card text-foreground shadow-xs"
							: "text-muted-foreground hover:text-foreground",
					].join(" ")}
				>
					Meio de semana
				</button>
				<button
					type="button"
					onClick={() => setMobileTab("weekend")}
					className={[
						"min-h-9 flex-1 rounded-lg text-sm font-medium transition-all",
						mobileTab === "weekend"
							? "bg-card text-foreground shadow-xs"
							: "text-muted-foreground hover:text-foreground",
					].join(" ")}
				>
					Fim de semana
				</button>
			</div>

			{/* Desktop: two columns */}
			<div className="hidden gap-5 sm:grid xl:grid-cols-2">
				<MeetingProgramCard
					slug={data.organizationSlug}
					weekStart={data.weekStart}
					weekEnd={data.weekEnd}
					program={data.midweek}
					canManage={data.canManage}
					variant="midweek"
				/>
				<MeetingProgramCard
					slug={data.organizationSlug}
					weekStart={data.weekStart}
					weekEnd={data.weekEnd}
					program={data.weekend}
					canManage={data.canManage}
					variant="weekend"
				/>
			</div>

			{/* Mobile: active tab */}
			<div className="sm:hidden">
				{mobileTab === "midweek" ? (
					<MeetingProgramCard
						slug={data.organizationSlug}
						weekStart={data.weekStart}
						weekEnd={data.weekEnd}
						program={data.midweek}
						canManage={data.canManage}
						variant="midweek"
					/>
				) : (
					<MeetingProgramCard
						slug={data.organizationSlug}
						weekStart={data.weekStart}
						weekEnd={data.weekEnd}
						program={data.weekend}
						canManage={data.canManage}
						variant="weekend"
					/>
				)}
			</div>
		</div>
	);
}
