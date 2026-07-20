"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { HiOutlineCalendarDays, HiOutlineClock } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { clearNextYearMeetingsAction } from "@/features/settings/actions/clear-next-year-meetings-action";
import { saveWeeklyMeetingsAction } from "@/features/settings/actions/save-weekly-meetings-action";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import type { WeeklyMeetingsView } from "@/features/settings/lib/meeting-schedule";

const WEEKDAYS = [
	{ value: "MONDAY", label: "Segunda-feira" },
	{ value: "TUESDAY", label: "Terça-feira" },
	{ value: "WEDNESDAY", label: "Quarta-feira" },
	{ value: "THURSDAY", label: "Quinta-feira" },
	{ value: "FRIDAY", label: "Sexta-feira" },
	{ value: "SATURDAY", label: "Sábado" },
	{ value: "SUNDAY", label: "Domingo" },
] as const;

const initialState: SettingsActionState = { success: false, message: "" };

const fieldClassName =
	"h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none ring-blue-500/30 focus:ring-4 dark:border-slate-800 dark:bg-slate-950";

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
		<section className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
			<header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<HiOutlineCalendarDays className="h-5 w-5 text-blue-600" />
						<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
							Reuniões de congregação
						</h2>
					</div>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						Duas reuniões por semana, horário fixo o ano todo (fuso Brasil,
						formato 24h). Alterações no horário atual abrem nova vigência a
						partir de hoje e preservam o histórico.
					</p>
				</div>
				<StatusBadge
					label={weekly.current.scheduleId ? "Configurado" : "Pendente"}
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

	return (
		<form action={formAction} className="space-y-6">
			<input type="hidden" name="organizationSlug" value={organizationSlug} />
			<input
				type="hidden"
				name="nextEnabled"
				value={nextEnabled ? "true" : "false"}
			/>

			<div className="space-y-3">
				<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
					Horário atual
				</h3>
				<div className="grid gap-4 md:grid-cols-2">
					<SlotFields
						prefix="currentSlot1"
						label="1ª reunião"
						defaultWeekday={s0?.weekday ?? "WEDNESDAY"}
						defaultTime={s0?.time ?? "19:30"}
						disabled={!canEdit}
					/>
					<SlotFields
						prefix="currentSlot2"
						label="2ª reunião"
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

			<div className="space-y-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
				<label className="flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-200">
					<input
						type="checkbox"
						checked={nextEnabled}
						disabled={!canEdit}
						onChange={(e) => setNextEnabled(e.target.checked)}
						className="h-4 w-4 rounded border-slate-300"
					/>
					Definir horário para {weekly.nextYear.year} (opcional)
				</label>
				<p className="text-xs text-slate-500 dark:text-slate-400">
					Entra em vigor automaticamente em 01/01/{weekly.nextYear.year}. A
					agenda desse ano já usa esse horário.
				</p>

				{nextEnabled ? (
					<div className="grid gap-4 md:grid-cols-2">
						<SlotFields
							prefix="nextSlot1"
							label="1ª reunião (próximo ano)"
							defaultWeekday={n0?.weekday ?? "WEDNESDAY"}
							defaultTime={n0?.time ?? "19:30"}
							disabled={!canEdit}
						/>
						<SlotFields
							prefix="nextSlot2"
							label="2ª reunião (próximo ano)"
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
							{clearing ? "Removendo..." : "Remover horário do próximo ano"}
						</Button>
					) : null}
					<Button
						type="submit"
						disabled={pending}
						className="h-11 rounded-2xl bg-linear-to-r from-blue-600 to-violet-600 text-white"
					>
						<HiOutlineClock className="mr-2 h-4 w-4" />
						{pending ? "Salvando..." : "Salvar reuniões"}
					</Button>
				</div>
			) : (
				<p className="text-sm text-slate-500">
					Somente administradores podem editar.
				</p>
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
	return (
		<div className="space-y-2 rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
			<p className="text-xs font-medium uppercase tracking-wide text-slate-500">
				{label}
			</p>
			<div className="space-y-2">
				<Label className="text-sm font-medium">Dia</Label>
				<select
					name={`${prefix}Weekday`}
					defaultValue={defaultWeekday}
					disabled={disabled}
					className={fieldClassName}
				>
					{WEEKDAYS.map((d) => (
						<option key={d.value} value={d.value}>
							{d.label}
						</option>
					))}
				</select>
			</div>
			<div className="space-y-2">
				<Label className="text-sm font-medium">Horário</Label>
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
