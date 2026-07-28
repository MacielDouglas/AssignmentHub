"use client";

type ErrorProps = {
	error: Error & { digest?: string };
	reset: () => void;
};

export default function GlobalRouteError({ error, reset }: ErrorProps) {
	return (
		<main className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="w-full max-w-lg rounded-4xl border border-border bg-card p-8 shadow-md text-center">
				<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
					<span className="text-2xl text-destructive">!</span>
				</div>
				<h1 className="mt-4 text-headline text-foreground">Algo deu errado</h1>
				<p className="mt-2 text-body text-muted-foreground">
					Ocorreu um erro inesperado ao carregar esta página. Tente novamente ou
					volte para a página inicial.
				</p>
				{process.env.NODE_ENV === "development" && error.message ? (
					<p className="mt-3 truncate rounded-lg bg-muted px-3 py-2 text-left text-caption text-muted-foreground">
						{error.message}
					</p>
				) : null}
				<div className="mt-6 flex items-center justify-center gap-3">
					<button
						type="button"
						onClick={reset}
						className="inline-flex h-11 items-center justify-center rounded-4xl bg-primary px-6 text-label text-primary-foreground shadow-md transition-all hover:brightness-90 active:translate-y-px"
					>
						Tentar novamente
					</button>
				</div>
			</div>
		</main>
	);
}
