"use client";

import { useState, useTransition } from "react";
import { createOrganizationAction } from "@/features/organization/application/actions/create-organization-action";

export function CreateOrganizationForm() {
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	return (
		<form
			className="space-y-4"
			onSubmit={(event) => {
				event.preventDefault();
				setErrorMessage(null);

				startTransition(async () => {
					const result = await createOrganizationAction({ name, slug });

					if (!result.success) {
						setErrorMessage(result.message);
					}
				});
			}}
		>
			<div className="space-y-2">
				<label htmlFor="name" className="text-sm font-medium text-foreground">
					Nome da organização
				</label>
				<input
					id="name"
					name="name"
					value={name}
					onChange={(event) => setName(event.target.value)}
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
					value={slug}
					onChange={(event) => setSlug(event.target.value)}
					className="h-11 w-full rounded-none border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
					placeholder="assignmenthub-brasil"
				/>
			</div>

			{errorMessage ? (
				<p className="text-sm text-destructive" role="alert">
					{errorMessage}
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
