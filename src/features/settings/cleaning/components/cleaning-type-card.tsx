"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
	HiOutlineBuildingOffice2,
	HiOutlineCalendar,
	HiOutlineSparkles,
} from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import { restoreCleaningDefaultsAction } from "@/features/settings/cleaning/actions/restore-cleaning-defaults-action";
import { saveCleaningTypeAction } from "@/features/settings/cleaning/actions/save-cleaning-type-action";
import { CleaningSectorsEditor } from "@/features/settings/cleaning/components/cleaning-sectors-editor";
import { CLEANING_TYPE_LABEL } from "@/features/settings/cleaning/lib/cleaning-defaults";
import type { CleaningTypeView } from "@/features/settings/cleaning/lib/cleaning-settings";

const initialState: SettingsActionState = { success: false, message: "" };

const fieldClassName =
	"h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none ring-blue-500/30 focus:ring-4 dark:border-slate-800 dark:bg-slate-950";

const WEEKDAYS = [
	{ value: "MONDAY", label: "Seg" },
	{ value: "TUESDAY", label: "Ter" },
	{ value: "WEDNESDAY", label: "Qua" },
	{ value: "THURSDAY", label: "Qui" },
	{ value: "FRIDAY", label: "Sex" },
	{ value: "SATURDAY", label: "Sáb" },
	{ value: "SUNDAY", label: "Dom" },
] as const;

const ICONS = {
	MEETING: HiOutlineBuildingOffice2,
	WEEKLY: HiOutlineCalendar,
	GENERAL: HiOutlineSparkles,
} as const;

const MODE_LABELS: Record<string, string> = {
	PERSON: "Pessoa",
	FAMILY: "Família",
	GROUP: "Grupo",
};

type Props = {
	organizationSlug: string;
	canEdit: boolean;
	typeView: CleaningTypeView;
};

export function CleaningTypeCard({
	organizationSlug,
	canEdit,
	typeView,
}: Props) {
	const router = useRouter();
	const Icon = ICONS[typeView.type];

	const [state, formAction, pending] = useActionState(
		saveCleaningTypeAction,
		initialState,
	);
	const [restoreState, restoreAction, restoring] = useActionState(
		restoreCleaningDefaultsAction,
		initialState,
	);

	const [enabled, setEnabled] = useState(typeView.enabled);
	const [mode, setMode] = useState(
		typeView.assignmentMode ?? typeView.allowedModes[0],
	);
	const [followVisit, setFollowVisit] = useState(
		typeView.followVisitSuppression,
	);
	const [weekdays, setWeekdays] = useState<string[]>([...typeView.weekdays]);
	const [dates, setDates] = useState(typeView.dates);

	const formKey = useMemo(
		() =>
			[
				typeView.configId,
				String(typeView.enabled),
				typeView.assignmentMode ?? "",
				typeView.weekdays.join(","),
				typeView.dates.map((d) => `${d.date}:${d.label ?? ""}`).join(","),
				String(typeView.followVisitSuppression),
			].join("|"),
		[typeView],
	);

	useEffect(() => {
		if (!state.success && !restoreState.success) return;
		router.refresh();
	}, [state.success, restoreState.success, router]);

	const toggleWeekday = (w: string) => {
		setWeekdays((cur) =>
			cur.includes(w) ? cur.filter((x) => x !== w) : [...cur, w],
		);
	};

	const addDate = () => {
		setDates((cur) => [
			...cur,
			{ id: `local-${cur.length}-${typeView.configId}`, date: "", label: "" },
		]);
	};

	const updateDate = (
		id: string,
		patch: Partial<{ date: string; label: string | null }>,
	) => {
		setDates((cur) => cur.map((d) => (d.id === id ? { ...d, ...patch } : d)));
	};

	const removeDate = (id: string) => {
		setDates((cur) => cur.filter((d) => d.id !== id));
	};

	return (
		<section className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
			<header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<Icon className="h-5 w-5 text-blue-600" />
						<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
							{CLEANING_TYPE_LABEL[typeView.type]}
						</h2>
					</div>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						{typeView.type === "MEETING"
							? "Acompanha os horários de reunião configurados. Opcionalmente some durante a visita do viajante."
							: typeView.type === "WEEKLY"
								? "Defina os dias da semana em que a limpeza semanal ocorre."
								: "Cadastre as datas da limpeza geral no ano."}
					</p>
				</div>
				<StatusBadge
					label={enabled ? "Ativa" : "Desativada"}
					tone={enabled ? "emerald" : "amber"}
				/>
			</header>

			{/* ========== FORM 1: salvar tipo ========== */}
			<form key={formKey} action={formAction} className="space-y-5">
				<input type="hidden" name="organizationSlug" value={organizationSlug} />
				<input type="hidden" name="type" value={typeView.type} />
				<input
					type="hidden"
					name="enabled"
					value={enabled ? "true" : "false"}
				/>
				<input type="hidden" name="assignmentMode" value={mode} />
				<input
					type="hidden"
					name="followVisit"
					value={followVisit ? "true" : "false"}
				/>
				<input
					type="hidden"
					name="datesJson"
					value={JSON.stringify(
						dates
							.filter((d) => d.date)
							.map((d) => ({ date: d.date, label: d.label || null })),
					)}
				/>
				{weekdays.map((w) => (
					<input key={w} type="hidden" name="weekdays" value={w} />
				))}

				<label className="flex items-center gap-3 text-sm font-medium">
					<input
						type="checkbox"
						checked={enabled}
						disabled={!canEdit}
						onChange={(e) => setEnabled(e.target.checked)}
						className="h-4 w-4 rounded border-slate-300"
					/>
					Habilitar este tipo de limpeza
				</label>

				<div className="space-y-2">
					<Label>Modo de designação</Label>
					<div className="flex flex-wrap gap-2">
						{typeView.allowedModes.map((m) => (
							<button
								key={m}
								type="button"
								disabled={!canEdit}
								onClick={() => setMode(m)}
								className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
									mode === m
										? "bg-linear-to-r from-blue-600 to-violet-600 text-white"
										: "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
								}`}
							>
								{MODE_LABELS[m] ?? m}
							</button>
						))}
					</div>
					<p className="text-xs text-slate-500">
						Trocar o modo não apaga os setores. Quem será designado é definido
						na tela de designações.
					</p>
				</div>

				{typeView.type === "MEETING" ? (
					<label className="flex items-center gap-3 text-sm">
						<input
							type="checkbox"
							checked={followVisit}
							disabled={!canEdit}
							onChange={(e) => setFollowVisit(e.target.checked)}
							className="h-4 w-4 rounded border-slate-300"
						/>
						Ocultar limpeza nos dias de visita do viajante (quando a reunião
						semanal também some)
					</label>
				) : null}

				{typeView.type === "WEEKLY" ? (
					<div className="space-y-2">
						<Label>Dias da semana</Label>
						<div className="flex flex-wrap gap-2">
							{WEEKDAYS.map((d) => {
								const on = weekdays.includes(d.value);
								return (
									<button
										key={d.value}
										type="button"
										disabled={!canEdit}
										onClick={() => toggleWeekday(d.value)}
										className={`rounded-2xl px-3 py-2 text-sm font-medium ${
											on
												? "bg-blue-600 text-white"
												: "border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950"
										}`}
									>
										{d.label}
									</button>
								);
							})}
						</div>
						{state.fieldErrors?.weekdays?.[0] ? (
							<p className="text-sm text-red-600">
								{state.fieldErrors.weekdays[0]}
							</p>
						) : null}
					</div>
				) : null}

				{typeView.type === "GENERAL" ? (
					<div className="space-y-3">
						<div className="flex items-center justify-between gap-2">
							<Label>Datas no ano</Label>
							{canEdit ? (
								<Button
									type="button"
									variant="outline"
									className="h-9 rounded-2xl"
									onClick={addDate}
								>
									Adicionar data
								</Button>
							) : null}
						</div>
						{dates.length === 0 ? (
							<p className="text-sm text-slate-500">Nenhuma data cadastrada.</p>
						) : (
							<ul className="space-y-2">
								{dates.map((d) => (
									<li
										key={d.id}
										className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-3 sm:flex-row sm:items-center dark:border-slate-800"
									>
										<input
											type="date"
											value={d.date}
											disabled={!canEdit}
											onChange={(e) =>
												updateDate(d.id, { date: e.target.value })
											}
											className={fieldClassName}
										/>
										<input
											type="text"
											placeholder="Rótulo (opcional)"
											value={d.label ?? ""}
											disabled={!canEdit}
											onChange={(e) =>
												updateDate(d.id, { label: e.target.value })
											}
											className={fieldClassName}
										/>
										{canEdit ? (
											<Button
												type="button"
												variant="outline"
												className="h-11 shrink-0 rounded-2xl"
												onClick={() => removeDate(d.id)}
											>
												Remover
											</Button>
										) : null}
									</li>
								))}
							</ul>
						)}
					</div>
				) : null}

				{state.message ? (
					<p
						className={`text-sm ${
							state.success ? "text-emerald-600" : "text-red-600"
						}`}
					>
						{state.message}
					</p>
				) : null}

				{canEdit ? (
					<div className="flex justify-end">
						<Button
							type="submit"
							disabled={pending}
							className="h-11 rounded-2xl bg-linear-to-r from-blue-600 to-violet-600 text-white"
						>
							{pending ? "Salvando..." : "Salvar este tipo"}
						</Button>
					</div>
				) : (
					<p className="text-sm text-slate-500">
						Somente administradores podem editar.
					</p>
				)}
			</form>

			{/* ========== FORM 2: restaurar defaults (SEPARADO) ========== */}
			{canEdit ? (
				<form
					action={restoreAction}
					className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end"
				>
					<input
						type="hidden"
						name="organizationSlug"
						value={organizationSlug}
					/>
					<input type="hidden" name="type" value={typeView.type} />
					<Button
						type="submit"
						variant="outline"
						disabled={restoring || pending}
						className="h-11 rounded-2xl"
					>
						{restoring
							? "Restaurando..."
							: "Restaurar setores padrão faltantes"}
					</Button>
				</form>
			) : null}

			{restoreState.message ? (
				<p
					className={`text-sm ${
						restoreState.success ? "text-emerald-600" : "text-red-600"
					}`}
				>
					{restoreState.message}
				</p>
			) : null}

			<CleaningSectorsEditor
				organizationSlug={organizationSlug}
				canEdit={canEdit}
				typeView={typeView}
				assignmentMode={mode}
			/>
		</section>
	);
}
