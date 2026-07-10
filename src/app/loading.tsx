export default function Loading() {
	return (
		<main className="bg-background">
			<section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
				<div className="h-16 animate-pulse border-b border-border" />
				<div className="grid flex-1 gap-6 py-10 lg:grid-cols-[1.1fr_0.9fr]">
					<div className="space-y-4">
						<div className="h-8 w-40 animate-pulse bg-muted" />
						<div className="h-14 w-full max-w-2xl animate-pulse bg-muted" />
						<div className="h-24 w-full max-w-3xl animate-pulse bg-muted" />
					</div>
					<div className="h-80 animate-pulse border border-border bg-card" />
				</div>
			</section>
		</main>
	);
}
