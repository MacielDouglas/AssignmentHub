"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import { deleteCleaningSectorAction } from "@/features/settings/cleaning/actions/delete-cleaning-sector-action";
import { upsertCleaningSectorAction } from "@/features/settings/cleaning/actions/upsert-cleaning-sector-action";
import type { CleaningSectorView } from "@/features/settings/cleaning/lib/cleaning-settings";
import type { CleaningType } from "@/generated/prisma/client";

const initialState: SettingsActionState = { success: false, message: "" };

const fieldClassName =
	"h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none ring-blue-500/30 focus:ring-4 dark:border-slate-800 dark:bg-slate-950";

type Props = {
	organizationSlug: string;
	canEdit: boolean;
	type: CleaningType;
	sector: CleaningSectorView | null;
	showPersonFields: boolean;
	onCancelNew?: () => void;
};

export function CleaningSectorRow({
	organizationSlug,
	canEdit,
	type,
	sector,
	showPersonFields,
	onCancelNew,
}: Props) {
	const router = useRouter();
	const isNew = sector == null;

	const [open, setOpen] = useState(isNew);
	/** Remonta o form a cada abertura → defaultValues frescos + action state limpo */
	const [editorEpoch, setEditorEpoch] = useState(0);

	const [state, formAction, pending] = useActionState(
		upsertCleaningSectorAction,
		initialState,
	);
	const [delState, delAction, deleting] = useActionState(
		deleteCleaningSectorAction,
		initialState,
	);

	useEffect(() => {
		if (!state.success && !delState.success) return;

		router.refresh();

		queueMicrotask(() => {
			setOpen(false);
			if (isNew) onCancelNew?.();
			// Próximo "Editar" abre form novo (sem success preso)
			setEditorEpoch((e) => e + 1);
		});
	}, [state.success, delState.success, router, isNew, onCancelNew]);

	const openEditor = () => {
		setEditorEpoch((e) => e + 1);
		setOpen(true);
	};

	const closeEditor = () => {
		setOpen(false);
		if (isNew) onCancelNew?.();
	};

	const showEditor = open && canEdit;

	return (
		<li
			className={`rounded-[20px] border p-4 ${
				sector && !sector.isActive
					? "border-slate-200 bg-slate-50 opacity-70 dark:border-slate-800 dark:bg-slate-900/40"
					: "border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50"
			}`}
		>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-1">
					<div className="flex flex-wrap items-center gap-2">
						<p className="font-medium text-slate-900 dark:text-slate-50">
							{sector?.name ?? "Novo setor"}
						</p>
						{sector ? (
							<StatusBadge
								label={sector.isActive ? "Ativo" : "Inativo"}
								tone={sector.isActive ? "emerald" : "amber"}
							/>
						) : null}
						{sector && showPersonFields && sector.peopleRequired != null ? (
							<StatusBadge
								label={`${sector.peopleRequired} pessoa(s)`}
								tone="blue"
							/>
						) : null}
						{sector?.targetSex === "MALE" ? (
							<StatusBadge label="Só masculino" tone="blue" />
						) : null}
						{sector?.targetSex === "FEMALE" ? (
							<StatusBadge label="Só feminino" tone="violet" />
						) : null}
					</div>
					{sector?.description ? (
						<p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
							{sector.description}
						</p>
					) : null}
				</div>

				{canEdit ? (
					<div className="flex flex-wrap gap-2">
						{!isNew ? (
							<Button
								type="button"
								variant="outline"
								className="h-9 rounded-2xl"
								onClick={() => {
									if (showEditor) closeEditor();
									else openEditor();
								}}
							>
								{showEditor ? "Fechar" : "Editar"}
							</Button>
						) : null}

						{sector ? (
							<>
								<form action={delAction}>
									<input
										type="hidden"
										name="organizationSlug"
										value={organizationSlug}
									/>
									<input type="hidden" name="sectorId" value={sector.id} />
									<input type="hidden" name="mode" value="soft" />
									<Button
										type="submit"
										variant="outline"
										disabled={deleting}
										className="h-9 rounded-2xl"
									>
										{sector.isActive ? "Desativar" : "Desativado"}
									</Button>
								</form>

								{sector.assignmentCount === 0 ? (
									<form action={delAction}>
										<input
											type="hidden"
											name="organizationSlug"
											value={organizationSlug}
										/>
										<input type="hidden" name="sectorId" value={sector.id} />
										<input type="hidden" name="mode" value="hard" />
										<Button
											type="submit"
											variant="outline"
											disabled={deleting}
											className="h-9 rounded-2xl text-red-600"
										>
											Excluir
										</Button>
									</form>
								) : null}
							</>
						) : null}
					</div>
				) : null}
			</div>

			{showEditor ? (
				<SectorEditForm
					key={editorEpoch}
					organizationSlug={organizationSlug}
					type={type}
					sector={sector}
					showPersonFields={showPersonFields}
					formAction={formAction}
					pending={pending}
					errorMessage={state.success ? null : state.message || null}
					delErrorMessage={delState.success ? null : delState.message || null}
					onCancel={closeEditor}
				/>
			) : null}
		</li>
	);
}

type SectorEditFormProps = {
	organizationSlug: string;
	type: CleaningType;
	sector: CleaningSectorView | null;
	showPersonFields: boolean;
	formAction: (payload: FormData) => void;
	pending: boolean;
	errorMessage: string | null;
	delErrorMessage: string | null;
	onCancel: () => void;
};

function SectorEditForm({
	organizationSlug,
	type,
	sector,
	showPersonFields,
	formAction,
	pending,
	errorMessage,
	delErrorMessage,
	onCancel,
}: SectorEditFormProps) {
	return (
		<form
			action={formAction}
			className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800"
		>
			<input type="hidden" name="organizationSlug" value={organizationSlug} />
			<input type="hidden" name="type" value={type} />
			{sector ? (
				<input type="hidden" name="sectorId" value={sector.id} />
			) : null}
			<input type="hidden" name="isActive" value="true" />

			<div className="space-y-2">
				<Label>Nome do setor</Label>
				<input
					name="name"
					required
					defaultValue={sector?.name ?? ""}
					className={fieldClassName}
				/>
			</div>

			<div className="space-y-2">
				<Label>Tarefas</Label>
				<textarea
					name="description"
					rows={4}
					defaultValue={sector?.description ?? ""}
					className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-blue-500/30 focus:ring-4 dark:border-slate-800 dark:bg-slate-950"
				/>
			</div>

			{showPersonFields ? (
				<div className="grid gap-3 sm:grid-cols-3">
					<div className="space-y-2">
						<Label>Qtd. pessoas</Label>
						<input
							type="number"
							name="peopleRequired"
							min={1}
							max={50}
							defaultValue={sector?.peopleRequired ?? 1}
							className={fieldClassName}
						/>
					</div>
					<div className="space-y-2">
						<Label>Permitir jovem</Label>
						<select
							name="allowYoung"
							defaultValue={sector?.allowYoung === false ? "false" : "true"}
							className={fieldClassName}
						>
							<option value="true">Sim</option>
							<option value="false">Não</option>
						</select>
					</div>
					<div className="space-y-2">
						<Label>Sexo</Label>
						<select
							name="targetSex"
							defaultValue={sector?.targetSex ?? "ANY"}
							className={fieldClassName}
						>
							<option value="ANY">Qualquer</option>
							<option value="MALE">Masculino</option>
							<option value="FEMALE">Feminino</option>
						</select>
					</div>
				</div>
			) : (
				<>
					<input type="hidden" name="allowYoung" value="true" />
					<input type="hidden" name="targetSex" value="ANY" />
				</>
			)}

			{errorMessage ? (
				<p className="text-sm text-red-600">{errorMessage}</p>
			) : null}
			{delErrorMessage ? (
				<p className="text-sm text-red-600">{delErrorMessage}</p>
			) : null}

			<div className="flex justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					className="h-10 rounded-2xl"
					onClick={onCancel}
				>
					Cancelar
				</Button>
				<Button
					type="submit"
					disabled={pending}
					className="h-10 rounded-2xl bg-linear-to-r from-blue-600 to-violet-600 text-white"
				>
					{pending ? "Salvando..." : "Salvar setor"}
				</Button>
			</div>
		</form>
	);
}
