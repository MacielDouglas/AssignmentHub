"use client";

type ErrorProps = {
	error: Error & { digest?: string };
	reset: () => void;
};

export default function GlobalRouteError({ error, reset }: ErrorProps) {
	return (
		<main className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="w-full max-w-lg border border-border bg-card p-6">
				<h1 className="text-2xl font-semibold text-foreground">
					Algo deu errado.
				</h1>
				<p className="mt-3 text-sm leading-6 text-muted-foreground">
					Ocorreu um erro inesperado ao carregar esta página.
				</p>
				<p className="mt-2 text-xs text-muted-foreground">{error.message}</p>
				<button
					type="button"
					onClick={reset}
					className="mt-6 inline-flex h-11 items-center justify-center rounded-none bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-95"
				>
					Tentar novamente
				</button>
			</div>
		</main>
	);
}
