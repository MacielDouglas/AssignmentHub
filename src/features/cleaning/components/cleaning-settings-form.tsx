"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { saveCleaningSettingsAction } from "../actions/save-cleaning-settings.action";
import {
	initialSaveCleaningSettingsState,
	type SaveCleaningSettingsState,
} from "../domain/cleaning-settings.types";
import type { CleaningSettingsFormState } from "../lib/map-cleaning-settings-form-initial-state";
import { CleaningSettingsTabs } from "./cleaning-settings-tabs";

type Props = {
	initialState: CleaningSettingsFormState;
};

export function CleaningSettingsForm({ initialState }: Props) {
	const [state, formAction, pending] = useActionState<
		SaveCleaningSettingsState,
		FormData
	>(saveCleaningSettingsAction, initialSaveCleaningSettingsState);

	const [formState, setFormState] =
		useState<CleaningSettingsFormState>(initialState);

	const suggestedDefaults = useMemo(
		() => initialState.defaults,
		[initialState.defaults],
	);

	function resetWholeFormToSuggestedDefaults() {
		setFormState((current) => ({
			...current,
			cleaningPerMeeting: suggestedDefaults.MEETING.enabled,
			weeklyCleaning: suggestedDefaults.WEEKLY.enabled,
			generalCleaning: suggestedDefaults.GENERAL.enabled,
			configs: {
				MEETING: structuredClone(suggestedDefaults.MEETING),
				WEEKLY: structuredClone(suggestedDefaults.WEEKLY),
				GENERAL: structuredClone(suggestedDefaults.GENERAL),
			},
		}));
	}

	function resetTypeToSuggestedDefault(type: "MEETING" | "WEEKLY" | "GENERAL") {
		setFormState((current) => {
			const nextConfig = structuredClone(suggestedDefaults[type]);
			const next = {
				...current,
				configs: {
					...current.configs,
					[type]: nextConfig,
				},
			};

			if (type === "MEETING") next.cleaningPerMeeting = nextConfig.enabled;
			if (type === "WEEKLY") next.weeklyCleaning = nextConfig.enabled;
			if (type === "GENERAL") next.generalCleaning = nextConfig.enabled;

			return next;
		});
	}

	const enabledSummary = useMemo(
		() => ({
			MEETING: formState.cleaningPerMeeting,
			WEEKLY: formState.weeklyCleaning,
			GENERAL: formState.generalCleaning,
		}),
		[formState],
	);

	function setTypeEnabled(
		type: "MEETING" | "WEEKLY" | "GENERAL",
		enabled: boolean,
	) {
		setFormState((current) => {
			const next = {
				...current,
				configs: {
					...current.configs,
					[type]: {
						...current.configs[type],
						enabled,
					},
				},
			};

			if (type === "MEETING") next.cleaningPerMeeting = enabled;
			if (type === "WEEKLY") next.weeklyCleaning = enabled;
			if (type === "GENERAL") next.generalCleaning = enabled;

			return next;
		});
	}

	const formErrors = state.errors;
	const globalErrors = formErrors._form ?? [];

	return (
		<form action={formAction} className="space-y-6">
			<input
				type="hidden"
				name="organizationId"
				value={formState.organizationId}
			/>
			<input
				type="hidden"
				name="settingsId"
				value={formState.settingsId ?? ""}
			/>
			<input
				type="hidden"
				name="cleaningPerMeeting"
				value={String(formState.cleaningPerMeeting)}
			/>
			<input
				type="hidden"
				name="weeklyCleaning"
				value={String(formState.weeklyCleaning)}
			/>
			<input
				type="hidden"
				name="generalCleaning"
				value={String(formState.generalCleaning)}
			/>

			<section className="space-y-4 rounded-2xl border p-4 md:p-6">
				<div className="space-y-1">
					<h2 className="text-base font-semibold">Tipos disponíveis</h2>
					<p className="text-sm text-muted-foreground">
						Ative apenas os tipos de limpeza usados na congregação.
					</p>
				</div>

				<div className="grid gap-3 md:grid-cols-3">
					{[
						{
							type: "MEETING" as const,
							label: "Limpeza por reunião",
							description: "Mostra a tab de limpeza por reunião.",
							checked: enabledSummary.MEETING,
						},
						{
							type: "WEEKLY" as const,
							label: "Limpeza semanal",
							description: "Mostra a tab de limpeza semanal.",
							checked: enabledSummary.WEEKLY,
						},
						{
							type: "GENERAL" as const,
							label: "Limpeza geral",
							description: "Mostra a tab de limpeza geral.",
							checked: enabledSummary.GENERAL,
						},
					].map((item) => (
						<div
							key={item.type}
							className="flex items-center justify-between gap-3 rounded-xl border p-4"
						>
							<div className="space-y-1">
								<Label className="text-sm font-medium">{item.label}</Label>
								<p className="text-xs text-muted-foreground">
									{item.description}
								</p>
							</div>

							<Switch
								checked={item.checked}
								onCheckedChange={(checked) =>
									setTypeEnabled(item.type, checked)
								}
							/>
						</div>
					))}
				</div>
			</section>

			<CleaningSettingsTabs
				configs={formState.configs}
				errors={formErrors}
				onConfigChange={(type, value) =>
					setFormState((current) => ({
						...current,
						configs: {
							...current.configs,
							[type]: value,
						},
					}))
				}
				onConfigReset={resetTypeToSuggestedDefault}
			/>

			{state.message ? (
				<div
					className={`rounded-xl border p-4 text-sm ${
						state.success
							? "border-green-200 bg-green-50 text-green-800"
							: "border-red-200 bg-red-50 text-red-800"
					}`}
				>
					<p>{state.message}</p>

					{globalErrors.length > 0 ? (
						<ul className="mt-2 list-disc space-y-1 pl-5">
							{globalErrors.map((error) => (
								<li key={error}>{error}</li>
							))}
						</ul>
					) : null}
				</div>
			) : null}

			<div className="flex justify-end gap-3">
				<Button
					type="button"
					variant="outline"
					onClick={resetWholeFormToSuggestedDefaults}
					disabled={pending}
				>
					Restaurar padrão sugerido
				</Button>

				<Button type="submit" disabled={pending}>
					{pending ? "Salvando..." : "Salvar configurações"}
				</Button>
			</div>
		</form>
	);
}
