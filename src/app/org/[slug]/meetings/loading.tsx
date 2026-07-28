export default function MeetingsLoading() {
	return (
		<div
			className="mx-auto w-full max-w-7xl space-y-5 pb-24 md:pb-10"
			aria-busy="true"
			aria-live="polite"
		>
			<div className="overflow-hidden rounded-4xl border border-border bg-card">
				<div className="h-16 animate-pulse bg-primary/80" />
				<div className="px-5 pb-4 pt-3.5 sm:px-6 sm:pb-5 sm:pt-4">
					<div className="h-5 w-56 animate-pulse rounded-md bg-muted" />
				</div>
			</div>

			<div className="flex rounded-xl border border-border bg-muted p-0.5 sm:hidden">
				<div className="h-9 flex-1 animate-pulse rounded-[10px] bg-white" />
				<div className="h-9 flex-1 animate-pulse rounded-[10px]" />
			</div>

			<div className="hidden gap-5 sm:grid xl:grid-cols-2">
				<div className="overflow-hidden rounded-4xl border border-border bg-card">
					<div className="h-14 animate-pulse border-b border-border bg-muted/80" />
					<div className="space-y-3 p-4 sm:p-5">
						<div className="flex items-center gap-2">
							<div className="h-4 w-1 animate-pulse rounded-full bg-muted" />
							<div className="h-3 w-28 animate-pulse rounded bg-muted" />
						</div>
						<div className="h-14 animate-pulse rounded-xl border border-border bg-card" />
						<div className="h-14 animate-pulse rounded-xl border border-border bg-card" />
						<div className="h-14 animate-pulse rounded-xl border border-border bg-card" />
						<div className="flex items-center gap-2">
							<div className="h-4 w-1 animate-pulse rounded-full bg-muted" />
							<div className="h-3 w-20 animate-pulse rounded bg-muted" />
						</div>
						<div className="h-14 animate-pulse rounded-xl border border-border bg-card" />
						<div className="h-14 animate-pulse rounded-xl border border-border bg-card" />
						<div className="h-14 animate-pulse rounded-xl border border-border bg-card" />
						<div className="h-14 animate-pulse rounded-xl border border-border bg-card" />
					</div>
				</div>
				<div className="overflow-hidden rounded-4xl border border-border bg-card">
					<div className="h-14 animate-pulse border-b border-border bg-muted/80" />
					<div className="space-y-3 p-4 sm:p-5">
						<div className="flex items-center gap-2">
							<div className="h-4 w-1 animate-pulse rounded-full bg-muted" />
							<div className="h-3 w-28 animate-pulse rounded bg-muted" />
						</div>
						<div className="h-14 animate-pulse rounded-xl border border-border bg-card" />
						<div className="h-14 animate-pulse rounded-xl border border-border bg-card" />
						<div className="h-14 animate-pulse rounded-xl border border-border bg-card" />
						<div className="flex items-center gap-2">
							<div className="h-4 w-1 animate-pulse rounded-full bg-muted" />
							<div className="h-3 w-20 animate-pulse rounded bg-muted" />
						</div>
						<div className="h-14 animate-pulse rounded-xl border border-border bg-card" />
						<div className="h-14 animate-pulse rounded-xl border border-border bg-card" />
					</div>
				</div>
			</div>

			<div className="sm:hidden">
				<div className="overflow-hidden rounded-4xl border border-border bg-card">
					<div className="h-14 animate-pulse border-b border-border bg-muted/80" />
					<div className="space-y-3 p-4">
						<div className="h-16 animate-pulse rounded-xl border border-border bg-card" />
						<div className="h-16 animate-pulse rounded-xl border border-border bg-card" />
						<div className="h-16 animate-pulse rounded-xl border border-border bg-card" />
						<div className="h-16 animate-pulse rounded-xl border border-border bg-card" />
						<div className="h-16 animate-pulse rounded-xl border border-border bg-card" />
						<div className="h-16 animate-pulse rounded-xl border border-border bg-card" />
					</div>
				</div>
			</div>

			<span className="sr-only">Carregando reuniões</span>
		</div>
	);
}
