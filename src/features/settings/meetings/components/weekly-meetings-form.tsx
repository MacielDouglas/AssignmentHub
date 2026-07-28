"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { HiOutlineCalendarDays, HiOutlineClock } from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import { clearNextYearMeetingsAction } from "@/features/settings/meetings/actions/clear-next-year-meetings-action";
import { saveWeeklyMeetingsAction } from "@/features/settings/meetings/actions/save-weekly-meetings-action";
import type { WeeklyMeetingsView } from "@/features/settings/meetings/lib/meeting-schedule";

// const WEEKDAYS = [
// 	{ value: "MONDAY", label: "Segunda-feira" },
// 	{ value: "TUESDAY", label: "Terça-feira" },
// 	{ value: "WEDNESDAY", label: "Quarta-feira" },
// 	{ value: "THURSDAY", label: "Quinta-feira" },
// 	{ value: "FRIDAY", label: "Sexta-feira" },
// 	{ value: "SATURDAY", label: "Sábado" },
// 	{ value: "SUNDAY", label: "Domingo" },
// ] as const;

const WEEKDAY_VALUES = [
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
	"SUNDAY",
] as const;

const initialState: SettingsActionState = { success: false, message: "" };

const fieldClassName =
	"h-11 w-full rounded-4xl border border-border bg-card px-3 text-sm outline-none ring-primary/30 focus:ring-4";

type WeeklyMeetingsFormProps = {
	organizationSlug: string;
	canEdit: boolean;
	weekly: WeeklyMeetingsView;
};

export function WeeklyMeetingsForm({
	organizationSlug,
	canEdit,
	weekly,
}: WeeklyMeetingsFormProps) {
	const t = useTranslations("SettingsMeetings");

	const router = useRouter();

	const [state, formAction, pending] = useActionState(
		saveWeeklyMeetingsAction,
		initialState,
	);
	const [clearState, clearAction, clearing] = useActionState(
		clearNextYearMeetingsAction,
		initialState,
	);

	useEffect(() => {
		if (!state.success) return;
		router.refresh();
	}, [state.success, router]);

	useEffect(() => {
		if (!clearState.success) return;
		router.refresh();
	}, [clearState.success, router]);

	// Quando o server manda dados novos, remonta o form (defaultValues + checkbox)
	const formKey = [
		weekly.current.scheduleId ?? "none",
		weekly.current.slots.map((s) => `${s.weekday}-${s.time}`).join("|"),
		weekly.nextYear.scheduleId ?? "none",
		weekly.nextYear.slots.map((s) => `${s.weekday}-${s.time}`).join("|"),
	].join("::");

	return (
		<section className="space-y-4 rounded-4xl border border-border bg-card p-5 shadow-sm sm:p-6">
			<header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<HiOutlineCalendarDays className="h-5 w-5 text-primary" />
						<h2 className="text-headline text-foreground">{t("title")}</h2>
					</div>
					<p className="text-sm text-muted-foreground">{t("description")}</p>
				</div>
				<StatusBadge
					label={
						weekly.current.scheduleId
							? t("statusConfigured")
							: t("statusPending")
					}
					tone={weekly.current.scheduleId ? "emerald" : "amber"}
				/>
			</header>

			<WeeklyMeetingsFormFields
				key={formKey}
				organizationSlug={organizationSlug}
				canEdit={canEdit}
				weekly={weekly}
				formAction={formAction}
				clearAction={clearAction}
				pending={pending}
				clearing={clearing}
				state={state}
				clearState={clearState}
			/>
		</section>
	);
}

type FormFieldsProps = {
	organizationSlug: string;
	canEdit: boolean;
	weekly: WeeklyMeetingsView;
	formAction: (payload: FormData) => void;
	clearAction: (payload: FormData) => void;
	pending: boolean;
	clearing: boolean;
	state: SettingsActionState;
	clearState: SettingsActionState;
};

function WeeklyMeetingsFormFields({
	organizationSlug,
	canEdit,
	weekly,
	formAction,
	clearAction,
	pending,
	clearing,
	state,
	clearState,
}: FormFieldsProps) {
	const s0 = weekly.current.slots[0];
	const s1 = weekly.current.slots[1];
	const n0 = weekly.nextYear.slots[0];
	const n1 = weekly.nextYear.slots[1];

	// Estado local só deste mount — reinicia quando o pai muda a key
	const [nextEnabled, setNextEnabled] = useState(
		Boolean(weekly.nextYear.scheduleId),
	);
	const t = useTranslations("SettingsMeetings");

	return (
		<form action={formAction} className="space-y-6">
			<input type="hidden" name="organizationSlug" value={organizationSlug} />
			<input
				type="hidden"
				name="nextEnabled"
				value={nextEnabled ? "true" : "false"}
			/>

			<div className="space-y-3">
				<h3 className="text-title text-foreground">{t("currentSchedule")}</h3>
				<div className="grid gap-4 md:grid-cols-2">
					<SlotFields
						prefix="currentSlot1"
						label={t("slot1")}
						defaultWeekday={s0?.weekday ?? "WEDNESDAY"}
						defaultTime={s0?.time ?? "19:30"}
						disabled={!canEdit}
					/>
					<SlotFields
						prefix="currentSlot2"
						label={t("slot2")}
						defaultWeekday={s1?.weekday ?? "SUNDAY"}
						defaultTime={s1?.time ?? "18:00"}
						disabled={!canEdit}
					/>
				</div>
				{state.fieldErrors?.currentSlot2Weekday?.[0] ? (
					<p className="text-sm text-red-600">
						{state.fieldErrors.currentSlot2Weekday[0]}
					</p>
				) : null}
			</div>

			<div className="space-y-3 rounded-[20px] border border-border bg-muted p-4">
				<label className="flex items-center gap-3 text-sm font-medium text-foreground">
					<input
						type="checkbox"
						checked={nextEnabled}
						disabled={!canEdit}
						onChange={(e) => setNextEnabled(e.target.checked)}
						className="h-4 w-4 rounded border-border"
					/>
					{t("nextYearOptional", { year: weekly.nextYear.year })}
				</label>
				<p className="text-xs text-muted-foreground">
					{t("nextYearHint", { year: weekly.nextYear.year })}
				</p>

				{nextEnabled ? (
					<div className="grid gap-4 md:grid-cols-2">
						<SlotFields
							prefix="nextSlot1"
							label={t("slot1Next")}
							defaultWeekday={n0?.weekday ?? "WEDNESDAY"}
							defaultTime={n0?.time ?? "19:30"}
							disabled={!canEdit}
						/>
						<SlotFields
							prefix="nextSlot2"
							label={t("slot2Next")}
							defaultWeekday={n1?.weekday ?? "SUNDAY"}
							defaultTime={n1?.time ?? "18:00"}
							disabled={!canEdit}
						/>
					</div>
				) : null}
			</div>

			{state.message ? (
				<p
					className={`text-sm ${
						state.success ? "text-emerald-600" : "text-red-600"
					}`}
				>
					{state.message}
				</p>
			) : null}
			{clearState.message ? (
				<p
					className={`text-sm ${
						clearState.success ? "text-emerald-600" : "text-red-600"
					}`}
				>
					{clearState.message}
				</p>
			) : null}

			{canEdit ? (
				<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					{weekly.nextYear.scheduleId ? (
						<Button
							type="submit"
							formAction={clearAction}
							variant="outline"
							disabled={clearing || pending}
							className="h-11 rounded-2xl"
						>
							{clearing ? t("removing") : t("removeNextYear")}
						</Button>
					) : null}
					<Button
						type="submit"
						disabled={pending}
						className="h-11 rounded-4xl bg-primary text-primary-foreground"
					>
						<HiOutlineClock className="mr-2 h-4 w-4" />
						{pending ? t("saving") : t("saveMeetings")}
					</Button>
				</div>
			) : (
				<p className="text-sm text-muted-foreground">{t("readOnly")}</p>
			)}
		</form>
	);
}

function SlotFields({
	prefix,
	label,
	defaultWeekday,
	defaultTime,
	disabled,
}: {
	prefix: string;
	label: string;
	defaultWeekday: string;
	defaultTime: string;
	disabled?: boolean;
}) {
	const t = useTranslations("SettingsMeetings");
	const tDays = useTranslations("Weekdays");
	return (
		<div className="space-y-2 rounded-[20px] border border-border bg-card p-4">
			<p className="text-label uppercase text-muted-foreground">{label}</p>
			<div className="space-y-2">
				<Label className="text-sm font-medium">{t("day")}</Label>
				<select
					name={`${prefix}Weekday`}
					defaultValue={defaultWeekday}
					disabled={disabled}
					className={fieldClassName}
				>
					{WEEKDAY_VALUES.map((d) => (
						<option key={d} value={d}>
							{tDays(d)}
						</option>
					))}
				</select>
			</div>
			<div className="space-y-2">
				<Label className="text-sm font-medium">{t("time")}</Label>
				<input
					type="time"
					name={`${prefix}Time`}
					defaultValue={defaultTime}
					disabled={disabled}
					className={fieldClassName}
				/>
			</div>
		</div>
	);
}
