export default function MeetingContentLoading() {
	return (
		<div
			className="space-y-5 pb-24 md:pb-8"
			aria-busy="true"
			aria-live="polite"
		>
			<div className="h-36 animate-pulse rounded-4xl bg-primary/70" />
			<div className="grid gap-5 md:grid-cols-[260px_minmax(0,1fr)]">
				<div className="hidden h-64 animate-pulse rounded-4xl border border-border bg-muted md:block" />
				<div className="h-80 animate-pulse rounded-4xl border border-border bg-muted" />
			</div>
			<span className="sr-only">Carregando conteúdo das reuniões</span>
		</div>
	);
}
