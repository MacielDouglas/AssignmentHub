import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationSettingsLoading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2">
				<Skeleton className="h-4 w-28" />
			</div>

			<section className="space-y-4">
				<Card>
					<CardHeader className="space-y-4">
						<div className="flex items-start gap-3">
							<Skeleton className="size-11 rounded-xl" />

							<div className="min-w-0 flex-1 space-y-2">
								<Skeleton className="h-6 w-64" />
								<Skeleton className="h-4 w-full max-w-2xl" />
								<Skeleton className="h-4 w-80" />
							</div>
						</div>
					</CardHeader>
				</Card>
			</section>

			<section className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader className="space-y-3">
						<Skeleton className="h-4 w-36" />
						<Skeleton className="h-6 w-52" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-4 w-44" />
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="space-y-3">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-6 w-24" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-4 w-56" />
					</CardContent>
				</Card>
			</section>

			<section className="space-y-3">
				<div className="space-y-1">
					<Skeleton className="h-5 w-20" />
					<Skeleton className="h-4 w-72" />
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<Card className="overflow-hidden">
						<CardContent className="p-4 sm:p-5">
							<div className="flex items-start gap-3">
								<Skeleton className="size-10 rounded-xl" />

								<div className="min-w-0 flex-1 space-y-2">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<Skeleton className="h-5 w-24" />
										<Skeleton className="h-6 w-24 rounded-full" />
									</div>

									<Skeleton className="h-4 w-full max-w-sm" />
									<Skeleton className="h-4 w-40" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="overflow-hidden">
						<CardContent className="p-4 sm:p-5">
							<div className="flex items-start gap-3">
								<Skeleton className="size-10 rounded-xl" />

								<div className="min-w-0 flex-1 space-y-2">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<Skeleton className="h-5 w-20" />
										<Skeleton className="h-6 w-24 rounded-full" />
									</div>

									<Skeleton className="h-4 w-full max-w-sm" />
									<Skeleton className="h-4 w-52" />
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>
		</div>
	);
}
