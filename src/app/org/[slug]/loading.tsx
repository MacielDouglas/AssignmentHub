const skeletonCards = ["card-1", "card-2", "card-3", "card-4"];

export default function OrganizationLoading() {
	return (
		<div className="space-y-6">
			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{skeletonCards.map((key) => (
					<div
						key={key}
						className="h-36 animate-pulse border border-border bg-card"
					/>
				))}
			</section>

			<section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
				<div className="h-48 animate-pulse border border-border bg-card" />
				<div className="h-48 animate-pulse border border-border bg-card" />
			</section>
		</div>
	);
}
