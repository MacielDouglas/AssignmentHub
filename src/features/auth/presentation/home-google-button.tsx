"use client";

import { FcGoogle } from "react-icons/fc";
import { authClient } from "@/lib/auth-client";

export function HomeGoogleButton() {
	const handleSignIn = async () => {
		await authClient.signIn.social({
			provider: "google",
			callbackURL: "/app",
		});
	};

	return (
		<button
			type="button"
			onClick={handleSignIn}
			className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-none bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-95 sm:w-auto sm:min-w-60"
		>
			<FcGoogle className="h-5 w-5" aria-hidden="true" />
			Entrar com Google
		</button>
	);
}
