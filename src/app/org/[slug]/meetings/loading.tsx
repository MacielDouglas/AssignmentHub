export default function MeetingsLoading() {
	return (
		<div className="space-y-5" aria-busy="true" aria-live="polite">
			<span className="sr-only">Carregando reuniões…</span>

			{/* Week nav skeleton */}
			<div className="overflow-hidden rounded-4xl border border-border bg-card shadow-sm">
				<div className="border-b border-border bg-muted px-5 py-3.5 sm:px-6 sm:py-4">
					<div className="flex items-center gap-3">
						<div className="h-9 w-9 animate-pulse rounded-3xl bg-muted-foreground/20" />
						<div className="h-4 w-40 animate-pulse rounded-full bg-muted-foreground/20" />
					</div>
				</div>
				<div className="px-5 pb-4 pt-3.5 sm:px-6 sm:pb-5 sm:pt-4">
					<div className="flex items-center justify-between gap-4">
						<div className="space-y-1.5">
							<div className="h-5 w-52 animate-pulse rounded-full bg-muted-foreground/20" />
							<div className="h-3 w-20 animate-pulse rounded-full bg-muted-foreground/20" />
						</div>
						<div className="flex items-center gap-1">
							<div className="h-9 w-9 animate-pulse rounded-xl bg-muted-foreground/20" />
							<div className="h-7 w-14 animate-pulse rounded-lg bg-muted-foreground/20" />
							<div className="h-9 w-9 animate-pulse rounded-xl bg-muted-foreground/20" />
						</div>
					</div>
				</div>
			</div>

			{/* Mobile tabs skeleton */}
			<div className="flex rounded-4xl border border-border bg-muted p-0.5 sm:hidden">
				<div className="min-h-9 flex-1 animate-pulse rounded-lg bg-card" />
				<div className="min-h-9 flex-1 rounded-lg" />
			</div>

			{/* Desktop: two program card skeletons */}
			<div className="hidden gap-5 sm:grid xl:grid-cols-2">
				<ProgramCardSkeleton />
				<ProgramCardSkeleton />
			</div>

			{/* Mobile: single card skeleton */}
			<div className="sm:hidden">
				<ProgramCardSkeleton />
			</div>
		</div>
	);
}

function ProgramCardSkeleton() {
	return (
		<div className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-border/40">
			<div className="flex items-center gap-3 border-b border-border/50 bg-gradient-to-b from-background to-muted/20 px-4 py-3.5 sm:px-5 sm:py-4">
				<div className="h-9 w-9 animate-pulse rounded-2xl bg-muted-foreground/20 sm:h-10 sm:w-10" />
				<div className="space-y-1">
					<div className="h-5 w-36 animate-pulse rounded-full bg-muted-foreground/20" />
					<div className="h-3 w-16 animate-pulse rounded-full bg-muted-foreground/20" />
				</div>
			</div>
			<div className="space-y-4 p-4 sm:p-5">
				{["a", "b", "c"].map((key) => (
					<div
						key={key}
						className="rounded-2xl border border-border/60 bg-card px-3 py-2.5 sm:px-3.5 sm:py-3"
					>
						<div className="flex items-start gap-3">
							<div className="h-7 w-7 animate-pulse rounded-xl bg-muted-foreground/20 sm:h-8 sm:w-8" />
							<div className="min-w-0 flex-1 space-y-2">
								<div className="h-4 w-32 animate-pulse rounded-full bg-muted-foreground/20" />
								<div className="h-3 w-48 animate-pulse rounded-full bg-muted-foreground/20" />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
