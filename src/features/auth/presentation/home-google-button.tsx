"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";

import { authClient } from "@/lib/auth-client";

export function HomeGoogleButton() {
	const [isPending, setIsPending] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleSignIn = async () => {
		try {
			setIsPending(true);
			setErrorMessage(null);

			await authClient.signIn.social(
				{
					provider: "google",
					callbackURL: "/app",
				},
				{
					onError: (ctx) => {
						setIsPending(false);
						setErrorMessage(
							ctx.error.message ||
								"Não foi possível iniciar o login com Google.",
						);
					},
				},
			);
		} catch {
			setIsPending(false);
			setErrorMessage("Não foi possível iniciar o login com Google.");
		}
	};

	return (
		<div className="space-y-3">
			<button
				type="button"
				onClick={handleSignIn}
				disabled={isPending}
				className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-none bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-60"
				aria-busy={isPending}
			>
				<FcGoogle className="h-5 w-5" aria-hidden="true" />
				{isPending ? "Conectando..." : "Entrar com Google"}
			</button>

			{errorMessage ? (
				<p className="text-sm text-destructive" role="alert">
					{errorMessage}
				</p>
			) : null}
		</div>
	);
}
