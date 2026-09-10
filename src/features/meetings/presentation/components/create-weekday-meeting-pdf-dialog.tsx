"use client";

import { format } from "date-fns";
import { enUS, es, ptBR } from "date-fns/locale";
import { FileDownIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
	type AvailableWeekdayMeetingDate,
	listWeekdayMeetingDatesAction,
	loadWeekdayMeetingDetailsAction,
} from "../../application/actions/weekday-meeting-pdf.action";
import { mapWeeksToPdfData } from "../../pdf/weekday-meeting-pdf-data";
import {
	getPdfI18n,
	mapAppLocaleToPdfLocale,
	PDF_LOCALE_OPTIONS,
} from "../../pdf/weekday-meeting-pdf-i18n";
import type { PdfLocale } from "../../pdf/weekday-meeting-pdf-types";
import { mapWeeksToWeekendPdfData } from "../../pdf/weekend-meeting-pdf-data";

type MeetingKindFilter = "MIDWEEK" | "WEEKEND";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	slug: string;
	currentLocale: string;
	initialKind?: MeetingKindFilter;
};

function getDateFnsLocale(pdfLocale: PdfLocale) {
	switch (pdfLocale) {
		case "es":
			return es;
		case "en":
			return enUS;
		default:
			return ptBR;
	}
}

function parseDateOnly(dateString: string): Date {
	const [year, month, day] = dateString.split("-").map(Number);

	return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function toDateOnlyString(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

function startOfWeekMonday(date: Date): Date {
	const result = new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
		12,
		0,
		0,
		0,
	);

	const weekday = result.getDay();
	const offset = weekday === 0 ? -6 : 1 - weekday;

	result.setDate(result.getDate() + offset);

	return result;
}

export function CreateWeekdayMeetingPdfDialog({
	open,
	onOpenChange,
	slug,
	currentLocale,
	initialKind = "MIDWEEK",
}: Props) {
	const defaultPdfLocale = useMemo(
		() => mapAppLocaleToPdfLocale(currentLocale),
		[currentLocale],
	);

	const [pdfLocale, setPdfLocale] = useState<PdfLocale>(defaultPdfLocale);
	const [meetingKind, setMeetingKind] =
		useState<MeetingKindFilter>(initialKind);
	const [availableDates, setAvailableDates] = useState<
		AvailableWeekdayMeetingDate[]
	>([]);
	const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
	const [isLoadingDates, setIsLoadingDates] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

	const availableDateSet = useMemo(
		() => new Set(availableDates.map((item) => item.date)),
		[availableDates],
	);

	const selectedDateList = useMemo(
		() => [...selectedDates].sort((a, b) => a.localeCompare(b)),
		[selectedDates],
	);

	const selectedCalendarDates = useMemo(
		() => selectedDateList.map(parseDateOnly),
		[selectedDateList],
	);

	const pdfI18n = useMemo(() => getPdfI18n(pdfLocale), [pdfLocale]);

	useEffect(() => {
		if (!open) {
			return;
		}

		setPdfLocale(defaultPdfLocale);
		setMeetingKind(initialKind);
		setSelectedDates(new Set());
		setError(null);
	}, [defaultPdfLocale, initialKind, open]);

	useEffect(() => {
		if (!open) {
			return;
		}

		let active = true;

		setSelectedDates(new Set());
		setError(null);
		setIsLoadingDates(true);

		void listWeekdayMeetingDatesAction({
			slug,
			kind: meetingKind,
		}).then((result) => {
			if (!active) {
				return;
			}

			if (result.ok) {
				setAvailableDates(result.data);

				const firstAvailableDate = result.data
					.map((item) => item.date)
					.sort((a, b) => a.localeCompare(b))[0];

				if (firstAvailableDate) {
					setCurrentMonth(parseDateOnly(firstAvailableDate));
				}
			} else {
				setAvailableDates([]);
				setError(result.error);
			}

			setIsLoadingDates(false);
		});

		return () => {
			active = false;
		};
	}, [meetingKind, open, slug]);

	const handleCalendarSelect = (dates: Date[] | undefined) => {
		if (isGenerating) {
			return;
		}

		const nextSelection = new Set<string>();

		for (const date of dates ?? []) {
			const dateOnly = toDateOnlyString(date);

			if (availableDateSet.has(dateOnly)) {
				nextSelection.add(dateOnly);
			}
		}

		setSelectedDates(nextSelection);
	};

	const handleRemoveDate = (dateString: string) => {
		if (isGenerating) {
			return;
		}

		setSelectedDates((previous) => {
			const next = new Set(previous);
			next.delete(dateString);
			return next;
		});
	};

	const handleClearSelection = () => {
		if (!isGenerating) {
			setSelectedDates(new Set());
		}
	};

	const weekStartsFromDates = useMemo(() => {
		const weeks = new Set<string>();

		for (const dateString of selectedDates) {
			const weekStart = startOfWeekMonday(parseDateOnly(dateString));
			weeks.add(toDateOnlyString(weekStart));
		}

		return [...weeks].sort((a, b) => a.localeCompare(b));
	}, [selectedDates]);

	const handleGenerate = async () => {
		if (selectedDates.size === 0 || isGenerating) {
			return;
		}

		setError(null);
		setIsGenerating(true);

		try {
			const result = await loadWeekdayMeetingDetailsAction({
				slug,
				weekStarts: weekStartsFromDates,
			});

			if (!result.ok) {
				setError(result.error);
				return;
			}

			const { jsPDF } = await import("jspdf");

			const createPdf = () => {
				return new jsPDF({
					orientation: "portrait",
					unit: "mm",
					format: "a4",
					compress: true,
				});
			};

			if (meetingKind === "WEEKEND") {
				const allMeetings = mapWeeksToWeekendPdfData(result.data, pdfLocale);

				const meetings = allMeetings
					.filter((meeting) => selectedDates.has(meeting.date))
					.sort((a, b) => a.date.localeCompare(b.date));

				if (meetings.length === 0) {
					setError("Nenhuma reunião encontrada para as datas selecionadas.");
					return;
				}

				const { generateWeekendMeetingPdf } = await import(
					"../../pdf/weekend-meeting-pdf"
				);

				generateWeekendMeetingPdf(meetings, pdfI18n, createPdf);
			} else {
				const allMeetings = mapWeeksToPdfData(result.data, pdfLocale);

				const meetings = allMeetings
					.filter((meeting) => selectedDates.has(meeting.date))
					.sort((a, b) => a.date.localeCompare(b.date));

				if (meetings.length === 0) {
					setError("Nenhuma reunião encontrada para as datas selecionadas.");
					return;
				}

				const { generateWeekdayMeetingPdf } = await import(
					"../../pdf/weekday-meeting-pdf"
				);

				generateWeekdayMeetingPdf(meetings, pdfI18n, createPdf);
			}

			onOpenChange(false);
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Falha ao gerar o PDF.",
			);
		} finally {
			setIsGenerating(false);
		}
	};

	const generateDisabled = selectedDates.size === 0 || isGenerating;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[min(800px,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
				<DialogHeader className="border-b px-5 py-4">
					<DialogTitle>
						Criar PDF — Reuniões de{" "}
						{meetingKind === "WEEKEND" ? "fim de semana" : "meio de semana"}
					</DialogTitle>
					<DialogDescription>
						Escolha o tipo e o idioma do documento e selecione uma ou mais datas
						para gerar o programa em PDF.
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto px-5 py-4">
					<div className="space-y-5">
						<div className="space-y-2">
							<Label htmlFor="pdf-kind">Tipo de reunião</Label>

							<Select
								value={meetingKind}
								onValueChange={(value) =>
									setMeetingKind(value as MeetingKindFilter)
								}
								disabled={isGenerating || isLoadingDates}
							>
								<SelectTrigger id="pdf-kind" className="w-full">
									<SelectValue />
								</SelectTrigger>

								<SelectContent>
									<SelectItem value="MIDWEEK">Meio de semana</SelectItem>
									<SelectItem value="WEEKEND">Fim de semana</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<Separator />

						<div className="space-y-2">
							<Label htmlFor="pdf-locale">Idioma do PDF</Label>
							<p className="text-caption text-muted-foreground">
								Este idioma será usado nos títulos e rótulos fixos do programa.
							</p>

							<Select
								value={pdfLocale}
								onValueChange={(value) => setPdfLocale(value as PdfLocale)}
								disabled={isGenerating}
							>
								<SelectTrigger id="pdf-locale" className="w-full">
									<SelectValue />
								</SelectTrigger>

								<SelectContent>
									{PDF_LOCALE_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<Separator />

						<div className="space-y-2">
							<Label>Selecione as datas</Label>
							<p className="text-caption text-muted-foreground">
								Apenas datas com programação cadastrada podem ser selecionadas.
							</p>

							{isLoadingDates ? (
								<div className="flex h-64 items-center justify-center">
									<p className="text-sm text-muted-foreground">
										Carregando datas disponíveis…
									</p>
								</div>
							) : (
								<Calendar
									mode="multiple"
									selected={selectedCalendarDates}
									onSelect={handleCalendarSelect}
									month={currentMonth}
									onMonthChange={setCurrentMonth}
									locale={getDateFnsLocale(pdfLocale)}
									disabled={(date) =>
										!availableDateSet.has(toDateOnlyString(date))
									}
									modifiers={{
										available: (date) =>
											availableDateSet.has(toDateOnlyString(date)),
									}}
									modifiersClassNames={{
										available:
											"relative font-medium text-primary after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
									}}
									classNames={{
										selected:
											"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
										disabled:
											"cursor-not-allowed text-muted-foreground/35 opacity-50",
									}}
								/>
							)}
						</div>

						<Separator />

						<div className="space-y-2">
							<p className="text-sm font-medium text-foreground">
								{selectedDates.size === 0
									? "Nenhuma data selecionada."
									: `${selectedDates.size} reunião(ões) selecionada(s)`}
							</p>

							{selectedDateList.length > 0 && (
								<ul className="space-y-1">
									{selectedDateList.map((dateString) => {
										const date = parseDateOnly(dateString);

										const formattedDate = format(
											date,
											"EEEE, d 'de' MMMM 'de' yyyy",
											{ locale: getDateFnsLocale(pdfLocale) },
										);

										return (
											<li
												key={dateString}
												className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-sm"
											>
												<span className="capitalize">{formattedDate}</span>

												<button
													type="button"
													onClick={() => handleRemoveDate(dateString)}
													disabled={isGenerating}
													className={cn(
														"inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50",
													)}
													aria-label={`Remover ${formattedDate}`}
												>
													<XIcon className="h-3 w-3" />
													Remover
												</button>
											</li>
										);
									})}
								</ul>
							)}

							{selectedDates.size > 0 && (
								<button
									type="button"
									onClick={handleClearSelection}
									disabled={isGenerating}
									className="text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
								>
									Limpar seleção
								</button>
							)}
						</div>

						{error && (
							<p
								role="alert"
								className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
							>
								{error}
							</p>
						)}
					</div>
				</div>

				<DialogFooter className="border-t px-5 py-3">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isGenerating}
						className="h-11 rounded-2xl"
					>
						Cancelar
					</Button>

					<Button
						onClick={handleGenerate}
						disabled={generateDisabled}
						className="h-11 rounded-2xl"
					>
						{isGenerating ? (
							<>
								<span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
								Gerando PDF…
							</>
						) : (
							<>
								<FileDownIcon className="mr-2 h-4 w-4" />
								Gerar PDF
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
