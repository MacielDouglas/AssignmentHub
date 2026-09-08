"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	clearMeetingAssignmentsAction,
	loadMeetingWeekForModalAction,
} from "../../application/actions/meeting-week-modal.action";
import { toIsoDateOnly } from "../../application/services/meeting-week-dates";
import type { MeetingWeekDto } from "../../domain/meeting-types";
import { MwbWeekHeader } from "./mwb-week-header";
import { MwbWeekParts, MwbWeekPartsSkeleton } from "./mwb-week-parts";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	slug: string;
	initialWeekStart: string;
	mode: "create" | "edit";
};

function addDaysToDate(date: Date, days: number): Date {
	const d = new Date(date);
	d.setUTCDate(d.getUTCDate() + days);
	return d;
}

function formatWeekLabel(start: string, end: string, locale: string): string {
	const parse = (s: string) => {
		const [y, m, d] = s.split("-").map(Number);
		return new Date(Date.UTC(y, m - 1, d));
	};

	const s = parse(start);
	const e = parse(end);

	const monthNames =
		locale === "es"
			? [
					"ene",
					"feb",
					"mar",
					"abr",
					"may",
					"jun",
					"jul",
					"ago",
					"sep",
					"oct",
					"nov",
					"dic",
				]
			: [
					"jan",
					"fev",
					"mar",
					"abr",
					"mai",
					"jun",
					"jul",
					"ago",
					"set",
					"out",
					"nov",
					"dez",
				];

	const sDay = s.getUTCDate();
	const eDay = e.getUTCDate();
	const sMonth = monthNames[s.getUTCMonth()];
	const eMonth = monthNames[e.getUTCMonth()];

	if (sMonth === eMonth) {
		return `${sDay}–${eDay} de ${sMonth}`;
	}
	return `${sDay} ${sMonth} – ${eDay} ${eMonth}`;
}

export function MeetingWeekModal({
	open,
	onOpenChange,
	slug,
	initialWeekStart,
	mode,
}: Props) {
	const [weekStart, setWeekStart] = useState(initialWeekStart);
	const [weekData, setWeekData] = useState<MeetingWeekDto | null>(null);
	const [loading, setLoading] = useState(false);
	const [clearing, startClearing] = useTransition();

	const loadWeek = useCallback(
		async (ws: string) => {
			setLoading(true);
			try {
				const result = await loadMeetingWeekForModalAction({
					slug,
					weekStart: ws,
				});
				if (result.ok) {
					setWeekData(result.data);
				} else {
					console.error(result.error);
				}
			} finally {
				setLoading(false);
			}
		},
		[slug],
	);

	useEffect(() => {
		if (open) {
			setWeekStart(initialWeekStart);
			loadWeek(initialWeekStart);
		}
	}, [open, initialWeekStart, loadWeek]);

	const midweek = weekData?.midweek;

	const weekLabel = midweek
		? formatWeekLabel(weekData.weekStart, weekData.weekEnd, weekData.locale)
		: "";

	const handlePrev = useCallback(() => {
		if (!weekData) return;
		const prev = toIsoDateOnly(addDaysToDate(new Date(weekData.weekStart), -7));
		setWeekStart(prev);
		loadWeek(prev);
	}, [weekData, loadWeek]);

	const handleNext = useCallback(() => {
		if (!weekData) return;
		const next = toIsoDateOnly(addDaysToDate(new Date(weekData.weekStart), 7));
		setWeekStart(next);
		loadWeek(next);
	}, [weekData, loadWeek]);

	const handleClearAll = useCallback(() => {
		if (!midweek) return;

		startClearing(async () => {
			const result = await clearMeetingAssignmentsAction({
				slug,
				programId: midweek.id,
			});

			if (result.ok) {
				loadWeek(weekStart);
			} else {
				console.error(result.error);
			}
		});
	}, [midweek, slug, weekStart, loadWeek]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[min(800px,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
				<DialogHeader className="border-b px-5 py-4">
					<DialogTitle>
						{mode === "create" ? "Criar Reunião" : "Editar Reunião"}
					</DialogTitle>
				</DialogHeader>

				<div className="border-b px-5 py-3">
					<MwbWeekHeader
						weekLabel={weekLabel}
						onPrev={handlePrev}
						onNext={handleNext}
						loading={loading}
						hasPrev={true}
						hasNext={true}
					/>
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
					{loading || !midweek ? (
						<MwbWeekPartsSkeleton />
					) : (
						<>
							{midweek.scheduledTime ? (
								<p className="mb-3 text-caption text-muted-foreground">
									Horário: {midweek.scheduledTime}
								</p>
							) : null}

							{midweek.isCancelled ? (
								<div className="mb-3 rounded-xl border border-amber-200/60 bg-amber-50/80 px-3 py-2">
									<p className="text-caption font-medium text-amber-900">
										{midweek.cancellationReason ?? "Reunião cancelada"}
									</p>
								</div>
							) : null}

							<MwbWeekParts
								slug={slug}
								parts={midweek.parts}
								canManage={weekData?.canManage ?? false}
							/>
						</>
					)}
				</div>

				{mode === "edit" && midweek && !midweek.isCancelled ? (
					<div className="border-t px-5 py-3">
						<Button
							variant="destructive"
							size="sm"
							disabled={clearing}
							onClick={handleClearAll}
						>
							{clearing ? "Limpando..." : "Apagar designações"}
						</Button>
					</div>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
