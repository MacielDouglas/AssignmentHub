"use client";

import Link from "next/link";
import { useMemo } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

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

	return (
		<div className="flex items-center justify-between gap-4">
			<div className="min-w-0">
				<h2 className="text-sm font-semibold text-gray-900 sm:text-base">
					Semana de {range}
				</h2>
				{isCurrentWeek ? (
					<p className="mt-0.5 text-xs text-blue-600">Semana atual</p>
				) : null}
			</div>

			<div className="flex shrink-0 items-center gap-1">
				<Link
					href={`/org/${slug}/meetings?week=${prev}`}
					className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
					aria-label="Semana anterior"
				>
					<HiChevronLeft className="h-4 w-4" />
				</Link>

				<Link
					href={`/org/${slug}/meetings`}
					className="flex h-7 items-center rounded-lg px-2.5 text-[11px] font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
					aria-label="Voltar para semana atual"
				>
					Hoje
				</Link>

				<Link
					href={`/org/${slug}/meetings?week=${next}`}
					className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
					aria-label="Próxima semana"
				>
					<HiChevronRight className="h-4 w-4" />
				</Link>
			</div>
		</div>
	);
}
