"use client";

import { ptBR } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type Props = {
	value: DateRange | undefined;
	bookedDates?: Date[];
	onChange: (value: DateRange | undefined) => void;
};

export function CleaningRangeCalendar({
	value,
	bookedDates = [],
	onChange,
}: Props) {
	return (
		<div className="space-y-4">
			<div className="flex items-start gap-3 rounded-2xl bg-muted/40 p-4">
				<div className="rounded-2xl bg-background p-2 shadow-sm">
					<CalendarDays className="size-5 text-primary" />
				</div>

				<div className="space-y-1">
					<h3 className="text-sm font-semibold">Selecione o período</h3>
					<p className="text-sm text-muted-foreground">
						Escolha um intervalo para gerar a escala. Datas já utilizadas
						aparecem destacadas para facilitar a conferência.
					</p>
				</div>
			</div>

			<div className="overflow-hidden rounded-3xl border bg-background p-3 shadow-sm">
				<Calendar
					mode="range"
					selected={value}
					onSelect={onChange}
					numberOfMonths={2}
					locale={ptBR}
					modifiers={{
						booked: bookedDates,
					}}
					className="w-full"
					classNames={{
						months:
							"flex w-full flex-col gap-6 lg:flex-row lg:items-start lg:justify-between",
						month: "w-full space-y-4",
						month_caption:
							"relative flex items-center justify-center pt-1 pb-2 text-sm font-semibold",
						caption_label: "text-base font-semibold",
						nav: "flex items-center gap-1",
						button_previous: cn(
							"inline-flex size-9 items-center justify-center rounded-xl border bg-background text-foreground transition hover:bg-muted",
						),
						button_next: cn(
							"inline-flex size-9 items-center justify-center rounded-xl border bg-background text-foreground transition hover:bg-muted",
						),
						table: "w-full border-collapse",
						weekdays: "grid grid-cols-7 gap-1",
						weekday:
							"h-9 text-center text-xs font-medium text-muted-foreground",
						week: "mt-1 grid grid-cols-7 gap-1",
						day: cn(
							"inline-flex size-10 items-center justify-center rounded-2xl text-sm transition",
							"hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
						),
						selected: "bg-primary text-primary-foreground hover:bg-primary/90",
						range_start:
							"bg-primary text-primary-foreground hover:bg-primary/90",
						range_end: "bg-primary text-primary-foreground hover:bg-primary/90",
						range_middle:
							"rounded-none bg-primary/12 text-foreground hover:bg-primary/16",
						today: "bg-foreground text-background hover:bg-foreground/90",
						outside: "text-muted-foreground/40",
						disabled: "opacity-40",
						hidden: "invisible",
					}}
					modifiersClassNames={{
						booked:
							"relative border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100",
					}}
				/>
			</div>

			<div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
				<div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
					<span className="size-2 rounded-full bg-primary" />
					Período selecionado
				</div>
				<div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
					<span className="size-2 rounded-full bg-amber-400" />
					Já usado anteriormente
				</div>
			</div>
		</div>
	);
}
