import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationScheduleSettingsLoading() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-4 w-44 rounded-full" />

			<section className="overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-sm">
				<div className="space-y-5 p-5 sm:p-6 lg:p-8">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div className="flex items-start gap-4">
							<Skeleton className="size-14 rounded-2xl" />

							<div className="min-w-0 flex-1 space-y-3">
								<div className="flex gap-2">
									<Skeleton className="h-6 w-20 rounded-full" />
									<Skeleton className="h-6 w-24 rounded-full" />
								</div>

								<Skeleton className="h-8 w-72" />
								<Skeleton className="h-4 w-full max-w-2xl" />
								<Skeleton className="h-4 w-80" />
							</div>
						</div>

						<Skeleton className="h-10 w-28 rounded-2xl" />
					</div>

					<div className="grid gap-3 sm:grid-cols-3">
						<Skeleton className="h-24 rounded-2xl" />
						<Skeleton className="h-24 rounded-2xl" />
						<Skeleton className="h-24 rounded-2xl" />
					</div>
				</div>
			</section>

			<section className="space-y-4 rounded-[28px] border border-border/60 bg-card p-4 shadow-sm sm:p-6">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<div className="space-y-2">
						<Skeleton className="h-7 w-56" />
						<Skeleton className="h-4 w-full max-w-2xl" />
					</div>

					<div className="flex flex-wrap gap-2">
						<Skeleton className="h-11 w-28 rounded-2xl" />
						<Skeleton className="h-11 w-44 rounded-2xl" />
						<Skeleton className="h-11 w-36 rounded-2xl" />
					</div>
				</div>

				<div className="grid gap-2 overflow-x-auto sm:grid-cols-3">
					<Skeleton className="h-12 rounded-2xl" />
					<Skeleton className="h-12 rounded-2xl" />
					<Skeleton className="h-12 rounded-2xl" />
				</div>

				<div className="space-y-4">
					<div className="rounded-3xl border border-border/60 p-4 sm:p-6">
						<div className="space-y-2">
							<Skeleton className="h-6 w-44" />
							<Skeleton className="h-4 w-full max-w-xl" />
						</div>

						<div className="mt-5 grid gap-4 lg:grid-cols-2">
							<Skeleton className="h-44 rounded-2xl" />
							<Skeleton className="h-44 rounded-2xl" />
						</div>
					</div>

					<div className="rounded-3xl border border-border/60 p-4 sm:p-6">
						<div className="space-y-2">
							<Skeleton className="h-6 w-48" />
							<Skeleton className="h-4 w-full max-w-xl" />
						</div>

						<div className="mt-5 space-y-4">
							<Skeleton className="h-52 rounded-2xl" />
							<Skeleton className="h-52 rounded-2xl" />
						</div>
					</div>
				</div>

				<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<Skeleton className="h-11 w-52 rounded-2xl" />
					<Skeleton className="h-11 w-40 rounded-2xl" />
				</div>
			</section>
		</div>
	);
}
