"use client";

type ErrorProps = {
	error: Error & { digest?: string };
	reset: () => void;
};

export default function OrganizationError({ error, reset }: ErrorProps) {
	return (
		<div className="border border-border bg-card p-6">
			<h2 className="text-xl font-semibold text-foreground">
				Não foi possível carregar a organização.
			</h2>
			<p className="mt-3 text-sm leading-6 text-muted-foreground">
				Houve um problema ao carregar este ambiente.
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
	);
}
