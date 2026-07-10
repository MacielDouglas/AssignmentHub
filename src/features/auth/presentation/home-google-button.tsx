"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";

import { authClient } from "@/lib/auth-client";

export function HomeGoogleButton() {
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSignIn = async () => {
		try {
			setIsPending(true);
			setError(null);

			await authClient.signIn.social({
				provider: "google",
				callbackURL: "/app",
				newUserCallbackURL: "/welcome",
			});
		} catch (err) {
			console.error("Erro ao iniciar login com Google:", err);
			setError("Não foi possível iniciar o login com Google.");
			setIsPending(false);
		}
	};

	return (
		<div className="space-y-3">
			<button
				type="button"
				onClick={handleSignIn}
				disabled={isPending}
				className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-none bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-60"
			>
				<FcGoogle className="h-5 w-5" aria-hidden="true" />
				{isPending ? "Conectando..." : "Entrar com Google"}
			</button>

			{error ? (
				<p className="text-sm text-destructive" role="alert">
					{error}
				</p>
			) : null}
		</div>
	);
}
