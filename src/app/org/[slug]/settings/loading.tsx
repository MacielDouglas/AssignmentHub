import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationSettingsLoading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2">
				<Skeleton className="h-4 w-32 rounded-full" />
			</div>

			<section className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
				<div className="space-y-5 p-5 sm:p-6">
					<div className="flex items-start gap-4">
						<Skeleton className="size-14 rounded-2xl" />

						<div className="min-w-0 flex-1 space-y-3">
							<Skeleton className="h-7 w-64" />
							<Skeleton className="h-4 w-full max-w-2xl" />
							<Skeleton className="h-4 w-52" />
						</div>
					</div>

					<div className="grid gap-3 sm:grid-cols-3">
						<Skeleton className="h-20 rounded-2xl" />
						<Skeleton className="h-20 rounded-2xl" />
						<Skeleton className="h-20 rounded-2xl" />
					</div>
				</div>
			</section>

			<section className="grid gap-4 xl:grid-cols-2">
				<Card className="rounded-3xl border-border/60 shadow-sm">
					<CardHeader className="space-y-3">
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-7 w-56" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-4 w-52" />
					</CardContent>
				</Card>

				<Card className="rounded-3xl border-border/60 shadow-sm">
					<CardHeader className="space-y-3">
						<Skeleton className="h-4 w-36" />
						<Skeleton className="h-7 w-28" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-4 w-60" />
					</CardContent>
				</Card>
			</section>

			<section className="space-y-4">
				<div className="space-y-2">
					<Skeleton className="h-5 w-24" />
					<Skeleton className="h-4 w-80" />
				</div>

				<div className="grid gap-4 xl:grid-cols-2">
					{[0, 1].map((item) => (
						<Card
							key={item}
							className="overflow-hidden rounded-3xl border-border/60 shadow-sm"
						>
							<CardContent className="p-5 sm:p-6">
								<div className="flex items-start gap-4">
									<Skeleton className="size-12 rounded-2xl" />

									<div className="min-w-0 flex-1 space-y-3">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<Skeleton className="h-5 w-28" />
											<Skeleton className="h-6 w-24 rounded-full" />
										</div>

										<Skeleton className="h-4 w-full max-w-sm" />
										<Skeleton className="h-4 w-44" />
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</section>
		</div>
	);
}
