"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

import { cn } from "@/lib/utils";

type Props = {
	slug: string;
	weekStart: string;
	weekEnd: string;
	locale: "pt" | "es";
};

function shiftIsoDate(value: string, days: number) {
	const date = new Date(`${value}T00:00:00.000Z`);
	date.setUTCDate(date.getUTCDate() + days);
	return date.toISOString().slice(0, 10);
}

function formatWeekRange(
	weekStart: string,
	weekEnd: string,
	locale: string,
): string {
	const start = new Date(`${weekStart}T00:00:00.000Z`);
	const end = new Date(`${weekEnd}T00:00:00.000Z`);

	const dayFormatter = new Intl.DateTimeFormat(locale, {
		day: "numeric",
		timeZone: "UTC",
	});

	const endDay = dayFormatter.format(end);

	if (locale === "es") {
		return `${dayFormatter.format(start)} – ${endDay} de ${new Intl.DateTimeFormat(
			locale,
			{ month: "long", year: "numeric", timeZone: "UTC" },
		).format(end)}`;
	}

	return `${dayFormatter.format(start)} a ${endDay} de ${new Intl.DateTimeFormat(
		locale,
		{ month: "long", timeZone: "UTC" },
	).format(start)} de ${new Intl.DateTimeFormat(locale, {
		year: "numeric",
		timeZone: "UTC",
	}).format(start)}`;
}

export function WeekNavigation({ slug, weekStart, weekEnd, locale }: Props) {
	const searchParams = useSearchParams();
	const view = searchParams.get("view") ?? "midweek";
	const dateLocale = locale === "es" ? "es" : "pt-BR";
	const prev = useMemo(() => shiftIsoDate(weekStart, -7), [weekStart]);
	const next = useMemo(() => shiftIsoDate(weekStart, 7), [weekStart]);
	const range = useMemo(
		() => formatWeekRange(weekStart, weekEnd, dateLocale),
		[weekStart, weekEnd, dateLocale],
	);
	const isCurrentWeek = useMemo(() => {
		const today = new Date();
		const start = new Date(`${weekStart}T00:00:00.000Z`);
		const end = new Date(`${weekEnd}T00:00:00.000Z`);
		return today >= start && today <= end;
	}, [weekStart, weekEnd]);

	const btnClass =
		"flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:border-border hover:bg-muted hover:text-foreground";

	return (
		<div className="flex items-center justify-between gap-4">
			<div className="min-w-0">
				<div className="flex items-center gap-2.5">
					<h2 className="text-title text-foreground sm:text-base">
						Semana de {range}
					</h2>
					{isCurrentWeek ? (
						<span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-caption font-medium text-primary">
							<span className="h-1.5 w-1.5 rounded-full bg-primary" />
							Atual
						</span>
					) : null}
				</div>
			</div>

			<div className="flex shrink-0 items-center gap-1.5">
				<Link
					href={`/org/${slug}/meetings?week=${prev}&view=${view}`}
					className={cn(btnClass, "active:scale-95")}
					aria-label="Semana anterior"
				>
					<HiChevronLeft className="h-4 w-4" />
				</Link>

				<Link
					href={`/org/${slug}/meetings?view=${view}`}
					className={cn(
						"flex h-8 items-center rounded-xl px-3 text-caption font-medium text-muted-foreground transition",
						"hover:bg-muted hover:text-foreground active:scale-95",
						isCurrentWeek && "pointer-events-none opacity-40",
					)}
					aria-label="Voltar para semana atual"
				>
					Hoje
				</Link>

				<Link
					href={`/org/${slug}/meetings?week=${next}&view=${view}`}
					className={cn(btnClass, "active:scale-95")}
					aria-label="Próxima semana"
				>
					<HiChevronRight className="h-4 w-4" />
				</Link>
			</div>
		</div>
	);
}
