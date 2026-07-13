"use client";

import { useActionState } from "react";
import { createPersonAction } from "@/features/people/actions/create-person-action";

const initialState = {
	success: false,
	message: "",
};

export function CreatePersonForm({ slug }: { slug: string }) {
	const [state, action, pending] = useActionState(
		createPersonAction,
		initialState,
	);

	return (
		<form action={action} className="space-y-4">
			<input type="hidden" name="slug" value={slug} />

			<div className="space-y-2">
				<label htmlFor="name" className="text-sm font-medium">
					Nome
				</label>
				<input
					id="name"
					name="name"
					className="w-full rounded-md border px-3 py-2"
					placeholder="Nome da pessoa"
				/>
			</div>

			<div className="space-y-2">
				<label htmlFor="sex" className="text-sm font-medium">
					Sexo
				</label>
				<select
					id="sex"
					name="sex"
					className="w-full rounded-md border px-3 py-2"
					defaultValue="MALE"
				>
					<option value="MALE">Masculino</option>
					<option value="FEMALE">Feminino</option>
				</select>
			</div>

			<div className="space-y-2">
				<label htmlFor="isStudent" className="text-sm font-medium">
					Estudante
				</label>
				<select
					id="isStudent"
					name="isStudent"
					className="w-full rounded-md border px-3 py-2"
					defaultValue="true"
				>
					<option value="true">Sim</option>
					<option value="false">Não</option>
				</select>
			</div>

			{state.message ? (
				<p
					className={`text-sm ${state.success ? "text-green-600" : "text-red-600"}`}
				>
					{state.message}
				</p>
			) : null}

			<button
				type="submit"
				disabled={pending}
				className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
			>
				{pending ? "Salvando..." : "Criar pessoa"}
			</button>
		</form>
	);
}
