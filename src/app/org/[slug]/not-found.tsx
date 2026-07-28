import Link from "next/link";

export default function OrgNotFound() {
	return (
		<div className="flex min-h-[60vh] items-center justify-center px-4">
			<div className="w-full max-w-lg rounded-4xl border border-border bg-card p-8 shadow-md text-center">
				<p className="text-display text-foreground">404</p>
				<h1 className="mt-2 text-headline text-foreground">
					Página não encontrada
				</h1>
				<p className="mt-2 text-body text-muted-foreground">
					Esta página não existe nesta organização.
				</p>
				<Link
					href="/select-organization"
					className="mt-6 inline-flex h-11 items-center justify-center rounded-4xl bg-primary px-6 text-label text-primary-foreground shadow-md transition-all hover:brightness-90 active:translate-y-px"
				>
					Selecionar organização
				</Link>
			</div>
		</div>
	);
}
