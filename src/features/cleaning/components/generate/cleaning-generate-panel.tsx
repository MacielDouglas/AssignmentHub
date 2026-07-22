"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import {
	HiOutlineCalendarDays,
	HiOutlineCheckCircle,
	HiOutlineUsers,
} from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { saveCleaningListAction } from "@/features/cleaning/actions/save-cleaning-list-action";
import { RosterEditor } from "@/features/cleaning/components/editor/roster-editor";
import type { CleaningPageData } from "@/features/cleaning/lib/cleaning-page-data";
import { generateRoster } from "@/features/cleaning/lib/generate-roster";
import type { RosterDraft } from "@/features/cleaning/lib/roster-types";
import { sectorsFromConfig } from "@/features/cleaning/lib/sectors-from-config";
import {
	generalSessionDates,
	maxRangeOk,
	meetingSessionDates,
	toDateKey,
	weeklySessionDates,
} from "@/features/cleaning/lib/session-dates";
import type { CleaningType, Weekday } from "@/generated/prisma/client";
import { DownloadCleaningPdfButton } from "../export/download-cleaning-pdf-button";

type Props = {
	data: CleaningPageData;
	draft: RosterDraft | null;
	onDraftChange: (d: RosterDraft | null) => void;
	onSaved: () => void;
};

const PRESET_IDS = ["4w", "month", "year"] as const;

export function CleaningGeneratePanel({
	data,
	draft,
	onDraftChange,
	onSaved,
}: Props) {
	const t = useTranslations("CleaningGenerate");
	const tTypes = useTranslations("CleaningTypes");
	const tSession = useTranslations("CleaningSession");
	const locale = useLocale();
	const router = useRouter();

	const [type, setType] = useState<CleaningType>("MEETING");
	const [from, setFrom] = useState(() => toDateKey(new Date()));
	const [to, setTo] = useState(() => {
		const d = new Date();
		d.setDate(d.getDate() + 28);
		return toDateKey(d);
	});
	const [selectedGeneral, setSelectedGeneral] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [saveMsg, setSaveMsg] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	const typeView = data.cleaningSettings.types.find((x) => x.type === type);
	const enabled = Boolean(typeView?.enabled);
	const sectors = useMemo(
		() => (typeView ? sectorsFromConfig(typeView) : []),
		[typeView],
	);

	const meetingSlots = data.weeklyMeetings.current.slots.map((s) => ({
		weekday: s.weekday,
		time: s.time,
	}));

	const applyPreset = (id: (typeof PRESET_IDS)[number]) => {
		const start = new Date();
		const fromKey = toDateKey(start);
		if (id === "4w") {
			const end = new Date(start);
			end.setDate(end.getDate() + 28);
			setFrom(fromKey);
			setTo(toDateKey(end));
			return;
		}
		if (id === "month") {
			const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
			setFrom(fromKey);
			setTo(toDateKey(end));
			return;
		}
		const end = new Date(start.getFullYear(), 11, 31);
		setFrom(fromKey);
		setTo(toDateKey(end));
	};

	const generalOptions = typeView?.dates ?? [];

	const handleGenerate = () => {
		setError(null);
		setSaveMsg(null);

		if (!enabled) {
			setError(t("errTypeDisabled"));
			return;
		}
		if (sectors.length === 0) {
			setError(t("errNoSectors"));
			return;
		}
		if (!maxRangeOk(from, to)) {
			setError(t("errMaxRange"));
			return;
		}
		if (data.people.length === 0) {
			setError(t("errNoPeople"));
			return;
		}

		let sessionDates: Array<{ date: string; label?: string | null }> = [];

		if (type === "MEETING") {
			if (meetingSlots.length === 0) {
				setError(t("errNoMeetingDays"));
				return;
			}
			sessionDates = meetingSessionDates(from, to, meetingSlots).map((s) => ({
				date: s.date,
				label: s.time
					? tSession("meetingWithTime", { time: s.time })
					: tSession("meeting"),
			}));
		} else if (type === "WEEKLY") {
			const wds = (typeView?.weekdays ?? []) as Weekday[];
			if (wds.length === 0) {
				setError(t("errNoWeeklyDays"));
				return;
			}
			sessionDates = weeklySessionDates(from, to, wds).map((s) => ({
				date: s.date,
				label: tSession("weekly"),
			}));
		} else {
			const selected =
				selectedGeneral.length > 0
					? selectedGeneral
					: generalOptions.map((d) => d.date);
			const labels = Object.fromEntries(
				generalOptions.map((d) => [d.date, d.label]),
			);
			sessionDates = generalSessionDates(selected, from, to, labels).map(
				(s) => ({
					date: s.date,
					label: s.label ?? tSession("general"),
				}),
			);
		}

		if (sessionDates.length === 0) {
			setError(t("errNoDates"));
			return;
		}

		const next = generateRoster({
			cleaningType: type,
			periodFrom: from,
			periodTo: to,
			keepFamilyTogether: true,
			sectors,
			people: data.people,
			sessionDates,
			history: data.history,
		});

		onDraftChange(next);
	};

	const handleSave = () => {
		if (!draft) return;
		setError(null);
		setSaveMsg(null);

		const fd = new FormData();
		fd.set(
			"payload",
			JSON.stringify({
				organizationSlug: data.organizationSlug,
				cleaningType: draft.cleaningType,
				periodFrom: draft.periodFrom,
				periodTo: draft.periodTo,
				locale,
				days: draft.days.map((d) => ({
					date: d.date,
					hiddenSectorIds: d.hiddenSectorIds,
					slots: d.slots.map((s) => ({
						sectorId: s.sectorId,
						personId: s.personId,
						familyId: s.familyId,
						groupId: s.groupId,
						position: s.position,
						isManual: s.isManual,
					})),
				})),
			}),
		);

		startTransition(async () => {
			const res = await saveCleaningListAction(
				{ success: false, message: "" },
				fd,
			);
			if (!res.success) {
				setError(res.message);
				return;
			}
			setSaveMsg(res.message);
			onDraftChange(null);
			router.refresh();
			onSaved();
		});
	};

	const presetLabel = (id: (typeof PRESET_IDS)[number]) => {
		if (id === "4w") return t("preset4w");
		if (id === "month") return t("presetMonth");
		return t("presetYear");
	};

	if (draft) {
		return (
			<div className="space-y-4">
				<div className="flex flex-wrap items-center justify-between gap-2 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40">
					<div className="flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-200">
						<HiOutlineCheckCircle className="h-5 w-5 shrink-0" />
						<span>{t("previewBanner")}</span>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							variant="outline"
							className="h-10 rounded-2xl"
							onClick={() => onDraftChange(null)}
						>
							{t("discard")}
						</Button>

						<DownloadCleaningPdfButton
							organizationName={data.organizationName}
							draft={draft}
						/>

						<Button
							type="button"
							disabled={pending}
							onClick={handleSave}
							className="h-10 rounded-2xl bg-linear-to-r from-blue-600 to-violet-600 text-white"
						>
							{pending ? t("saving") : t("saveTable")}
						</Button>
					</div>
				</div>

				{error ? <p className="text-sm text-red-600">{error}</p> : null}

				<RosterEditor draft={draft} onChange={onDraftChange} />
			</div>
		);
	}

	return (
		<div className="space-y-5">
			<section className="space-y-3">
				<h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
					{t("typeSection")}
				</h2>
				<div className="grid gap-2">
					{data.cleaningSettings.types.map((row) => {
						const on = type === row.type;
						const ok = row.enabled && row.sectors.some((s) => s.isActive);
						const activeCount = row.sectors.filter((s) => s.isActive).length;
						return (
							<button
								key={row.type}
								type="button"
								disabled={!ok}
								onClick={() => setType(row.type)}
								className={`rounded-[22px] border p-4 text-left transition ${
									on
										? "border-transparent bg-linear-to-r from-blue-600 to-violet-600 text-white shadow-md"
										: ok
											? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
											: "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60 dark:border-slate-900 dark:bg-slate-950"
								}`}
							>
								<div className="flex items-start justify-between gap-2">
									<div>
										<p className="font-semibold">{tTypes(row.type)}</p>
										<p
											className={`mt-1 text-xs ${on ? "text-white/80" : "text-slate-500"}`}
										>
											{ok
												? t("sectorsMode", {
														count: activeCount,
														mode: row.assignmentMode ?? "—",
													})
												: t("configureInSettings")}
										</p>
									</div>
									<StatusBadge
										label={row.enabled ? t("statusOn") : t("statusOff")}
										tone={row.enabled ? "emerald" : "amber"}
									/>
								</div>
							</button>
						);
					})}
				</div>
			</section>

			<section className="space-y-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
				<div className="flex items-center gap-2">
					<HiOutlineCalendarDays className="h-5 w-5 text-blue-600" />
					<h2 className="text-sm font-semibold">{t("period")}</h2>
				</div>

				<div className="flex flex-wrap gap-2">
					{PRESET_IDS.map((id) => (
						<button
							key={id}
							type="button"
							onClick={() => applyPreset(id)}
							className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium dark:border-slate-700"
						>
							{presetLabel(id)}
						</button>
					))}
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1.5">
						<Label className="text-xs">{t("start")}</Label>
						<input
							type="date"
							value={from}
							onChange={(e) => setFrom(e.target.value)}
							className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
						/>
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs">{t("end")}</Label>
						<input
							type="date"
							value={to}
							onChange={(e) => setTo(e.target.value)}
							className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
						/>
					</div>
				</div>
			</section>

			{type === "MEETING" ? (
				<div className="rounded-[22px] border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
					<p className="font-medium">{t("familyTitle")}</p>
					<p className="mt-0.5 text-xs text-slate-500">{t("familyBody")}</p>
				</div>
			) : null}

			{type === "GENERAL" && generalOptions.length > 0 ? (
				<section className="space-y-2 rounded-[22px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
					<h3 className="text-sm font-semibold">{t("generalDatesTitle")}</h3>
					<p className="text-xs text-slate-500">{t("generalDatesHint")}</p>
					<ul className="space-y-2">
						{generalOptions.map((d) => {
							const on = selectedGeneral.includes(d.date);
							return (
								<label key={d.id} className="flex items-center gap-3 text-sm">
									<input
										type="checkbox"
										checked={on}
										onChange={() => {
											setSelectedGeneral((cur) =>
												on ? cur.filter((x) => x !== d.date) : [...cur, d.date],
											);
										}}
									/>
									<span>
										{d.date}
										{d.label ? ` — ${d.label}` : ""}
									</span>
								</label>
							);
						})}
					</ul>
				</section>
			) : null}

			<div className="flex items-center gap-2 rounded-[18px] bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">
				<HiOutlineUsers className="h-4 w-4 shrink-0" />
				{t("eligibleSummary", {
					people: data.people.length,
					sectors: sectors.length,
				})}
			</div>

			{error ? <p className="text-sm text-red-600">{error}</p> : null}
			{saveMsg ? <p className="text-sm text-emerald-600">{saveMsg}</p> : null}

			<Button
				type="button"
				onClick={handleGenerate}
				className="h-12 w-full rounded-2xl bg-linear-to-r from-blue-600 to-violet-600 text-base text-white shadow-lg"
			>
				{t("createTable")}
			</Button>
		</div>
	);
}
