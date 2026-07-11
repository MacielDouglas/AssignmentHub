"use client";

import { useActionState } from "react";
import {
	type CreateOrganizationActionState,
	createOrganizationAction,
} from "@/features/organization/application/actions/create-organization-action";

const initialState: CreateOrganizationActionState = {
	success: false,
	message: "",
};

export function CreateOrganizationForm() {
	const [state, formAction, isPending] = useActionState(
		createOrganizationAction,
		initialState,
	);

	return (
		<form action={formAction} className="space-y-4">
			<div className="space-y-2">
				<label htmlFor="name" className="text-sm font-medium text-foreground">
					Nome da organização
				</label>
				<input
					id="name"
					name="name"
					className="h-11 w-full rounded-none border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
					placeholder="Ex.: AssignmentHub Brasil"
				/>
			</div>

			<div className="space-y-2">
				<label htmlFor="slug" className="text-sm font-medium text-foreground">
					Slug
				</label>
				<input
					id="slug"
					name="slug"
					className="h-11 w-full rounded-none border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
					placeholder="assignmenthub-brasil"
				/>
			</div>

			{state.message ? (
				<p className="text-sm text-destructive" role="alert">
					{state.message}
				</p>
			) : null}

			<button
				type="submit"
				disabled={isPending}
				className="inline-flex h-11 items-center justify-center rounded-none bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
			>
				{isPending ? "Criando organização..." : "Criar organização"}
			</button>
		</form>
	);
}
