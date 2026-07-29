export default function PeopleLoading() {
	return (
		<div className="space-y-5" aria-busy="true" aria-live="polite">
			<span className="sr-only">Carregando pessoas…</span>

			{/* Stats skeleton */}
			<div className="rounded-4xl border border-border bg-card p-4 shadow-sm sm:p-5">
				<div className="grid grid-cols-3 gap-2 sm:gap-3">
					{["a", "b", "c", "d", "e", "f"].map((key) => (
						<article
							key={key}
							className="rounded-3xl border border-border bg-muted/50 p-3 sm:p-4"
						>
							<div className="h-3 w-16 animate-pulse rounded-full bg-muted-foreground/20" />
							<div className="mt-2 h-7 w-10 animate-pulse rounded-full bg-muted-foreground/20" />
						</article>
					))}
				</div>
			</div>

			{/* People list skeleton */}
			<div className="space-y-4">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="h-6 w-44 animate-pulse rounded-full bg-muted-foreground/20" />
					<div className="h-11 w-40 animate-pulse rounded-4xl bg-muted-foreground/20" />
				</div>

				<div className="space-y-3">
					{["a", "b", "c", "d"].map((key) => (
						<article
							key={key}
							className="rounded-4xl border border-border bg-card p-4 shadow-sm sm:p-5"
						>
							<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
								<div className="min-w-0 flex-1 space-y-4">
									<div className="flex items-start gap-3">
										<div className="h-11 w-11 animate-pulse rounded-3xl bg-muted-foreground/20" />
										<div className="space-y-2">
											<div className="h-5 w-40 animate-pulse rounded-full bg-muted-foreground/20" />
											<div className="h-3 w-20 animate-pulse rounded-full bg-muted-foreground/20" />
										</div>
									</div>
									<div className="flex gap-2">
										<div className="h-7 w-16 animate-pulse rounded-full bg-muted-foreground/20" />
										<div className="h-7 w-16 animate-pulse rounded-full bg-muted-foreground/20" />
									</div>
								</div>
								<div className="flex w-full gap-2 lg:w-auto lg:min-w-56">
									<div className="h-11 flex-1 animate-pulse rounded-4xl bg-muted-foreground/20" />
									<div className="h-11 w-24 animate-pulse rounded-2xl bg-muted-foreground/20" />
								</div>
							</div>
						</article>
					))}
				</div>
			</div>
		</div>
	);
}
