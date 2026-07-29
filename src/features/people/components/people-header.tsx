export function PeopleHeader() {
	return (
		<header className="rounded-4xl border border-border bg-muted p-5 sm:p-6">
			<p className="text-label uppercase text-muted-foreground">
				AssignmentHub
			</p>
			<h1 className="mt-2 text-display text-foreground sm:text-display">
				Pessoas e designações
			</h1>
			<p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
				Cadastre pessoas, organize famílias, controle privilégios e designações.
			</p>
		</header>
	);
}
