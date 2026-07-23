export default function MeetingContentLoading() {
	return (
		<main className="space-y-6" aria-busy="true" aria-live="polite">
			<div className="h-48 animate-pulse rounded-[32px] bg-linear-to-br from-blue-600/80 to-violet-600/80" />
			<div className="h-40 animate-pulse rounded-[28px] border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
			<div className="h-64 animate-pulse rounded-[28px] border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
			<span className="sr-only">Carregando conteúdo das reuniões…</span>
		</main>
	);
}
