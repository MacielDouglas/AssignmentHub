export default function SettingsLoading() {
	return (
		<main className="space-y-6" aria-busy="true" aria-live="polite">
			<span className="sr-only">Carregando configurações…</span>

			{/* Header skeleton */}
			<div className="rounded-4xl border border-border bg-card p-5 shadow-sm sm:p-6">
				<div className="flex items-start gap-3">
					<div className="h-12 w-12 animate-pulse rounded-2xl bg-muted" />
					<div className="flex-1 space-y-2">
						<div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
						<div className="h-7 w-48 animate-pulse rounded-full bg-muted" />
						<div className="h-4 max-w-md animate-pulse rounded-full bg-muted" />
					</div>
				</div>
			</div>

			{/* Tabs skeleton */}
			<div className="flex gap-2 rounded-3xl border border-border bg-card p-2">
				<div className="h-10 w-28 animate-pulse rounded-2xl bg-muted" />
				<div className="h-10 w-24 animate-pulse rounded-2xl bg-muted" />
				<div className="h-10 w-32 animate-pulse rounded-2xl bg-muted" />
			</div>

			{/* Weekly meetings panel skeleton */}
			<div className="space-y-4 rounded-4xl border border-border bg-card p-5 shadow-sm sm:p-6">
				<div className="flex items-start justify-between gap-3">
					<div className="space-y-2">
						<div className="h-5 w-56 animate-pulse rounded-full bg-muted" />
						<div className="h-4 w-72 max-w-full animate-pulse rounded-full bg-muted" />
						<div className="h-4 w-64 max-w-full animate-pulse rounded-full bg-muted" />
					</div>
					<div className="h-7 w-24 animate-pulse rounded-full bg-muted" />
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div className="h-40 animate-pulse rounded-2xl border border-border bg-muted" />
					<div className="h-40 animate-pulse rounded-2xl border border-border bg-muted" />
				</div>

				<div className="h-28 animate-pulse rounded-2xl bg-muted" />

				<div className="flex justify-end">
					<div className="h-11 w-40 animate-pulse rounded-2xl bg-muted" />
				</div>
			</div>

			{/* Special events panel skeleton */}
			<div className="space-y-4 rounded-4xl border border-border bg-card p-5 shadow-sm sm:p-6">
				<div className="flex items-start justify-between gap-3">
					<div className="space-y-2">
						<div className="h-5 w-44 animate-pulse rounded-full bg-muted" />
						<div className="h-4 w-80 max-w-full animate-pulse rounded-full bg-muted" />
					</div>
					<div className="h-11 w-36 animate-pulse rounded-2xl bg-muted" />
				</div>
				<div className="space-y-3">
					<div className="h-20 animate-pulse rounded-2xl bg-muted" />
					<div className="h-20 animate-pulse rounded-2xl bg-muted" />
				</div>
			</div>
		</main>
	);
}
