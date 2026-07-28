export default function Loading() {
	return (
		<section className="space-y-4">
			<header className="app-card app-card-body space-y-4">
				<div className="space-y-1">
					<div className="h-5 w-24 rounded-full bg-muted" />
					<div className="mt-2 h-7 w-36 rounded-full bg-muted" />
					<div className="mt-2 h-4 w-full max-w-lg rounded-full bg-muted" />
				</div>

				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex gap-2">
						<div className="h-10 w-40 rounded-4xl bg-muted" />
						<div className="h-10 w-32 rounded-4xl bg-muted" />
					</div>
					<div className="h-8 w-36 rounded-full bg-muted" />
				</div>

				<div className="h-11 w-full rounded-2xl bg-muted" />
			</header>

			<section className="overflow-hidden rounded-4xl border border-border bg-card shadow-sm">
				<div className="grid gap-4 p-4 sm:p-5">
					<div className="rounded-4xl border border-border bg-card p-4 shadow-sm sm:p-5">
						<div className="flex items-start gap-3">
							<div className="h-4 w-4 rounded bg-muted" />
							<div className="min-w-0 flex-1 space-y-3">
								<div className="flex gap-2">
									<div className="h-7 w-40 rounded-full bg-muted" />
									<div className="h-7 w-32 rounded-full bg-muted" />
								</div>
								<div className="h-5 w-3/4 rounded-full bg-muted" />
								<div className="h-4 w-1/2 rounded-full bg-muted" />
							</div>
						</div>
					</div>
					<div className="rounded-4xl border border-border bg-card p-4 shadow-sm sm:p-5">
						<div className="flex items-start gap-3">
							<div className="h-4 w-4 rounded bg-muted" />
							<div className="min-w-0 flex-1 space-y-3">
								<div className="flex gap-2">
									<div className="h-7 w-40 rounded-full bg-muted" />
									<div className="h-7 w-32 rounded-full bg-muted" />
								</div>
								<div className="h-5 w-3/4 rounded-full bg-muted" />
								<div className="h-4 w-1/2 rounded-full bg-muted" />
							</div>
						</div>
					</div>
					<div className="rounded-4xl border border-border bg-card p-4 shadow-sm sm:p-5">
						<div className="flex items-start gap-3">
							<div className="h-4 w-4 rounded bg-muted" />
							<div className="min-w-0 flex-1 space-y-3">
								<div className="flex gap-2">
									<div className="h-7 w-40 rounded-full bg-muted" />
									<div className="h-7 w-32 rounded-full bg-muted" />
								</div>
								<div className="h-5 w-3/4 rounded-full bg-muted" />
								<div className="h-4 w-1/2 rounded-full bg-muted" />
							</div>
						</div>
					</div>
				</div>
			</section>
		</section>
	);
}
