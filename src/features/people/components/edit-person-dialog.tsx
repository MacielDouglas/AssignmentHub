"use client";

import { useActionState, useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	type UpdatePersonActionState,
	updatePersonAction,
} from "@/features/people/actions/update-person-action";

type EditPersonDialogProps = {
	slug: string;
	person: {
		id: string;
		name: string;
		sex: "MALE" | "FEMALE";
		isActive: boolean;
		isStudent: boolean;
	};
	trigger: React.ReactNode;
};

const initialState: UpdatePersonActionState = {
	success: false,
	message: "",
};

function EditPersonDialogForm({
	formKey,
	slug,
	person,
	onSuccess,
}: {
	formKey: number;
	slug: string;
	person: EditPersonDialogProps["person"];
	onSuccess: () => void;
}) {
	const [state, formAction, pending] = useActionState(
		updatePersonAction,
		initialState,
	);

	useEffect(() => {
		if (state.success) {
			onSuccess();
		}
	}, [state.success, onSuccess]);

	return (
		<form key={formKey} action={formAction} className="space-y-4">
			<input type="hidden" name="slug" value={slug} />
			<input type="hidden" name="personId" value={person.id} />

			<div className="space-y-2">
				<label htmlFor={`name-${person.id}`} className="text-sm font-medium">
					Nome
				</label>
				<input
					id={`name-${person.id}`}
					name="name"
					defaultValue={person.name}
					className="w-full rounded-md border px-3 py-2"
					placeholder="Nome da pessoa"
				/>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<label htmlFor={`sex-${person.id}`} className="text-sm font-medium">
						Sexo
					</label>
					<select
						id={`sex-${person.id}`}
						name="sex"
						defaultValue={person.sex}
						className="w-full rounded-md border px-3 py-2"
					>
						<option value="MALE">Masculino</option>
						<option value="FEMALE">Feminino</option>
					</select>
				</div>

				<div className="space-y-2">
					<label
						htmlFor={`isStudent-${person.id}`}
						className="text-sm font-medium"
					>
						Estudante
					</label>
					<select
						id={`isStudent-${person.id}`}
						name="isStudent"
						defaultValue={String(person.isStudent)}
						className="w-full rounded-md border px-3 py-2"
					>
						<option value="true">Sim</option>
						<option value="false">Não</option>
					</select>
				</div>
			</div>

			<div className="space-y-2">
				<label
					htmlFor={`isActive-${person.id}`}
					className="text-sm font-medium"
				>
					Situação
				</label>
				<select
					id={`isActive-${person.id}`}
					name="isActive"
					defaultValue={String(person.isActive)}
					className="w-full rounded-md border px-3 py-2"
				>
					<option value="true">Ativo</option>
					<option value="false">Inativo</option>
				</select>
			</div>

			{state.message ? (
				<p
					className={`text-sm ${state.success ? "text-green-600" : "text-red-600"}`}
				>
					{state.message}
				</p>
			) : null}

			<div className="flex justify-end">
				<button
					type="submit"
					disabled={pending}
					className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
				>
					{pending ? "Salvando..." : "Salvar alterações"}
				</button>
			</div>
		</form>
	);
}

export function EditPersonDialog({
	slug,
	person,
	trigger,
}: EditPersonDialogProps) {
	const [open, setOpen] = useState(false);
	const [formKey, setFormKey] = useState(0);

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				setOpen(nextOpen);

				if (nextOpen) {
					setFormKey((current) => current + 1);
				}
			}}
		>
			<DialogTrigger asChild>{trigger}</DialogTrigger>

			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Editar pessoa</DialogTitle>
				</DialogHeader>

				<EditPersonDialogForm
					formKey={formKey}
					slug={slug}
					person={person}
					onSuccess={() => {
						setOpen(false);
						setFormKey((current) => current + 1);
					}}
				/>
			</DialogContent>
		</Dialog>
	);
}
