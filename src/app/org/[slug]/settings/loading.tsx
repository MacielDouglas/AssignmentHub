export default function SettingsLoading() {
	return (
		<main className="space-y-6" aria-busy="true" aria-live="polite">
			<span className="sr-only">Carregando configurações…</span>

			{/* Header skeleton */}
			<div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
				<div className="flex items-start gap-3">
					<div className="h-12 w-12 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
					<div className="flex-1 space-y-2">
						<div className="h-3 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
						<div className="h-7 w-48 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
						<div className="h-4 max-w-md animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
					</div>
				</div>
			</div>

			{/* Tabs skeleton */}
			<div className="flex gap-2 rounded-[24px] border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
				<div className="h-10 w-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
				<div className="h-10 w-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
				<div className="h-10 w-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
			</div>

			{/* Weekly meetings panel skeleton */}
			<div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
				<div className="flex items-start justify-between gap-3">
					<div className="space-y-2">
						<div className="h-5 w-56 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
						<div className="h-4 w-72 max-w-full animate-pulse rounded-full bg-slate-100 dark:bg-slate-900" />
						<div className="h-4 w-64 max-w-full animate-pulse rounded-full bg-slate-100 dark:bg-slate-900" />
					</div>
					<div className="h-7 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div className="h-40 animate-pulse rounded-[20px] border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900" />
					<div className="h-40 animate-pulse rounded-[20px] border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900" />
				</div>

				<div className="h-28 animate-pulse rounded-[20px] bg-slate-50 dark:bg-slate-900" />

				<div className="flex justify-end">
					<div className="h-11 w-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
				</div>
			</div>

			{/* Special events panel skeleton */}
			<div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
				<div className="flex items-start justify-between gap-3">
					<div className="space-y-2">
						<div className="h-5 w-44 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
						<div className="h-4 w-80 max-w-full animate-pulse rounded-full bg-slate-100 dark:bg-slate-900" />
					</div>
					<div className="h-11 w-36 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
				</div>
				<div className="space-y-3">
					<div className="h-20 animate-pulse rounded-[20px] bg-slate-50 dark:bg-slate-900" />
					<div className="h-20 animate-pulse rounded-[20px] bg-slate-50 dark:bg-slate-900" />
				</div>
			</div>
		</main>
	);
}
