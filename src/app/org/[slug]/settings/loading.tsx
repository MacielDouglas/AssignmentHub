export default function SettingsLoading() {
	return (
		<div
			className="mx-auto w-full max-w-6xl space-y-5 pb-24 md:pb-8"
			aria-busy="true"
			aria-live="polite"
		>
			<span className="sr-only">Carregando configurações…</span>

			{/* Header skeleton */}
			<div className="rounded-4xl border border-border bg-muted p-5 sm:p-6">
				<div className="h-3 w-28 animate-pulse rounded-full bg-muted-foreground/20" />
				<div className="mt-3 h-8 w-48 animate-pulse rounded-full bg-muted-foreground/20" />
				<div className="mt-3 h-4 max-w-lg animate-pulse rounded-full bg-muted-foreground/20" />
			</div>

			{/* Grid: sidebar + content */}
			<div className="grid gap-5 md:grid-cols-[260px_minmax(0,1fr)] md:items-start">
				{/* Sidebar skeleton */}
				<aside className="hidden md:block md:sticky md:top-4">
					<div className="rounded-[28px] border border-border bg-card p-3 shadow-sm">
						<div className="space-y-1">
							{["a", "b", "c"].map((key) => (
								<div
									key={key}
									className="flex min-h-12 items-center gap-3 rounded-4xl px-3 py-2.5"
								>
									<div className="h-5 w-5 shrink-0 animate-pulse rounded bg-muted-foreground/20" />
									<div className="min-w-0 flex-1 space-y-1.5">
										<div className="h-3 w-20 animate-pulse rounded-full bg-muted-foreground/20" />
										<div className="h-2.5 w-32 animate-pulse rounded-full bg-muted-foreground/20" />
									</div>
								</div>
							))}
						</div>
					</div>
				</aside>

				{/* Content skeleton */}
				<div className="min-w-0 space-y-5" aria-busy="true">
					{/* Weekly meetings panel skeleton */}
					<div className="space-y-4 rounded-4xl border border-border bg-card p-5 shadow-sm sm:p-6">
						<div className="flex items-start justify-between gap-3">
							<div className="space-y-2">
								<div className="h-5 w-56 animate-pulse rounded-full bg-muted-foreground/20" />
								<div className="h-4 w-72 max-w-full animate-pulse rounded-full bg-muted-foreground/20" />
								<div className="h-4 w-64 max-w-full animate-pulse rounded-full bg-muted-foreground/20" />
							</div>
							<div className="h-7 w-24 animate-pulse rounded-full bg-muted-foreground/20" />
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="h-40 animate-pulse rounded-2xl border border-border bg-muted" />
							<div className="h-40 animate-pulse rounded-2xl border border-border bg-muted" />
						</div>

						<div className="h-28 animate-pulse rounded-2xl bg-muted" />

						<div className="flex justify-end">
							<div className="h-11 w-40 animate-pulse rounded-2xl bg-muted-foreground/20" />
						</div>
					</div>

					{/* Special events panel skeleton */}
					<div className="space-y-4 rounded-4xl border border-border bg-card p-5 shadow-sm sm:p-6">
						<div className="flex items-start justify-between gap-3">
							<div className="space-y-2">
								<div className="h-5 w-44 animate-pulse rounded-full bg-muted-foreground/20" />
								<div className="h-4 w-80 max-w-full animate-pulse rounded-full bg-muted-foreground/20" />
							</div>
							<div className="h-11 w-36 animate-pulse rounded-2xl bg-muted-foreground/20" />
						</div>
						<div className="space-y-3">
							<div className="h-20 animate-pulse rounded-2xl bg-muted" />
							<div className="h-20 animate-pulse rounded-2xl bg-muted" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
