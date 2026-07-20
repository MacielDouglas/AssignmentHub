// src/features/cleaning/components/cleaning-settings-form.tsx
"use client";

import { BrushCleaning, RotateCcw, Save, Shield } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { saveCleaningSettingsAction } from "../actions/save-cleaning-settings.action";
import {
	type CleaningSettingsFormState,
	type CleaningTypeConfigFormState,
	initialSaveCleaningSettingsState,
	type SaveCleaningSettingsState,
} from "../domain/cleaning-settings.types";
import { createDefaultTypeConfig } from "../lib/cleaning-settings-defaults";
import { CleaningSettingsTabs } from "./cleaning-settings-tabs";

type Props = { initialState: CleaningSettingsFormState };

export function CleaningSettingsForm({ initialState }: Props) {
	const [state, formAction, pending] = useActionState<
		SaveCleaningSettingsState,
		FormData
	>(saveCleaningSettingsAction, initialSaveCleaningSettingsState);

	const [form, setForm] = useState(initialState);
	const readOnly = !form.canManage;

	const summary = useMemo(() => {
		return [
			form.meeting.enabled ? "Por reunião" : null,
			form.weekly.enabled ? "Semanal" : null,
			form.general.enabled ? "Geral" : null,
		]
			.filter(Boolean)
			.join(" • ");
	}, [form.meeting.enabled, form.weekly.enabled, form.general.enabled]);

	function updateType(
		key: "meeting" | "weekly" | "general",
		value: CleaningTypeConfigFormState,
	) {
		setForm((current) => ({ ...current, [key]: value }));
	}

	function resetAll() {
		setForm((current) => ({
			...current,
			meeting: createDefaultTypeConfig("MEETING"),
			weekly: createDefaultTypeConfig("WEEKLY"),
			general: createDefaultTypeConfig("GENERAL"),
		}));
	}

	return (
		<form action={formAction} className="space-y-5">
			<input type="hidden" name="organizationId" value={form.organizationId} />

			<section className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(37,99,235,0.14)_0%,rgba(124,58,237,0.14)_55%,rgba(255,255,255,0.02)_100%)] shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
				<div className="relative p-5 sm:p-6">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.16),transparent_28%)]" />
					<div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div className="flex items-start gap-4">
							<div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/70 shadow-sm backdrop-blur dark:bg-white/10">
								<BrushCleaning className="size-6 text-[#2563EB]" />
							</div>
							<div className="space-y-2">
								<div className="flex flex-wrap gap-2">
									<Badge className="border-0 bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/10">
										Módulo limpeza
									</Badge>
									<Badge className="border-0 bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/10">
										Designação inteligente
									</Badge>
								</div>
								<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
									Configurações de limpeza
								</h1>
								<p className="max-w-2xl text-sm leading-6 text-muted-foreground">
									Defina modos de designação e setores para reunião, semanal e
									geral. Datas de reunião vêm da agenda; semanal e geral ficam
									aqui.
								</p>
							</div>
						</div>

						<div className="rounded-2xl border border-white/20 bg-white/70 px-4 py-3 shadow-sm backdrop-blur dark:bg-white/5">
							<p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
								Organização
							</p>
							<p className="mt-1 text-sm font-semibold">
								{form.organizationName}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								{summary || "Nenhum tipo ativo"}
							</p>
						</div>
					</div>
				</div>
			</section>

			{readOnly ? (
				<div className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
					<Shield className="mt-0.5 size-4 shrink-0" />
					<p>Modo leitura. Apenas proprietário e administrador podem salvar.</p>
				</div>
			) : null}

			<section className="rounded-[28px] border border-border/60 bg-card/95 p-4 shadow-sm sm:p-6">
				<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="text-lg font-semibold tracking-tight">
							Tipos de limpeza
						</h2>
						<p className="text-sm text-muted-foreground">
							Navegue pelas abas e configure cada fluxo com clareza.
						</p>
					</div>
					<div className="flex flex-col gap-2 sm:flex-row">
						<Button
							type="button"
							variant="outline"
							disabled={pending || readOnly}
							onClick={resetAll}
							className="h-11 rounded-2xl"
						>
							<RotateCcw className="mr-2 size-4" />
							Restaurar
						</Button>
						<Button
							type="submit"
							disabled={pending || readOnly}
							className="h-11 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8]"
						>
							<Save className="mr-2 size-4" />
							{pending ? "Salvando..." : "Salvar configurações"}
						</Button>
					</div>
				</div>

				<CleaningSettingsTabs
					form={form}
					readOnly={readOnly}
					onChange={updateType}
				/>

				{state.message ? (
					<div
						className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
							state.success
								? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100"
								: "border-red-200 bg-red-50 text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100"
						}`}
					>
						{state.message}
					</div>
				) : null}
			</section>
		</form>
	);
}
