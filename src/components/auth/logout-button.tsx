"use client";

import { useState } from "react";
import { HiOutlineArrowRightOnRectangle } from "react-icons/hi2";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
	const [isPending, setIsPending] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleLogout = async () => {
		try {
			setIsPending(true);
			setErrorMessage(null);

			await authClient.signOut({
				fetchOptions: {
					onSuccess: () => {
						window.location.href = "/";
					},
				},
			});
		} catch {
			setIsPending(false);
			setErrorMessage("Não foi possível sair da conta.");
		}
	};

	return (
		<div className="space-y-2">
			<button
				type="button"
				onClick={handleLogout}
				disabled={isPending}
				className="inline-flex h-10 items-center justify-center gap-2 rounded-none border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
			>
				<HiOutlineArrowRightOnRectangle
					className="h-4 w-4"
					aria-hidden="true"
				/>
				{isPending ? "Saindo..." : "Sair"}
			</button>

			{errorMessage ? (
				<p className="text-xs text-destructive" role="alert">
					{errorMessage}
				</p>
			) : null}
		</div>
	);
}
