"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import { saveAssignmentSettingsAction } from "@/features/settings/assignments/actions/save-assignment-settings-action";
import type { AssignmentSettingsView } from "@/features/settings/assignments/lib/assignment-settings";

const initialState: SettingsActionState = { success: false, message: "" };

export function AssignmentSettingsPanel({
	organizationSlug,
	canEdit,
	settings,
}: {
	organizationSlug: string;
	canEdit: boolean;
	settings: AssignmentSettingsView;
}) {
	const [state, formAction, pending] = useActionState(
		saveAssignmentSettingsAction,
		initialState,
	);
	return (
		<section className="space-y-4 rounded-4xl border border-border bg-card p-5 shadow-sm sm:p-6">
			<header className="space-y-1">
				<h2 className="text-headline text-foreground">
					Designações — elegibilidade e rodízio
				</h2>
				<p className="text-sm text-muted-foreground">
					Modo de rodízio padrão das designações. Regras de elegibilidade por
					parte ({settings.rulesCount} cadastradas) serão editadas aqui na
					próxima etapa.
				</p>
			</header>
			<form
				action={formAction}
				className="flex flex-col gap-3 sm:flex-row sm:items-end"
			>
				<input type="hidden" name="organizationSlug" value={organizationSlug} />
				<label className="space-y-2 text-sm font-medium">
					Modo de rodízio
					<select
						name="rotationMode"
						defaultValue={settings.rotationMode}
						disabled={!canEdit}
						className="h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm sm:w-64"
					>
						<option value="LEAST_LOAD">Menor carga (fairness)</option>
						<option value="ROUND_ROBIN">Rodízio sequencial</option>
					</select>
				</label>
				{canEdit ? (
					<Button
						type="submit"
						disabled={pending}
						className="h-11 rounded-4xl bg-primary text-primary-foreground"
					>
						{pending ? "Salvando..." : "Salvar"}
					</Button>
				) : null}
			</form>
			{state.message ? (
				<p
					className={`text-sm ${state.success ? "text-emerald-600" : "text-red-600"}`}
				>
					{state.message}
				</p>
			) : null}
		</section>
	);
}
