import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { getMeetingContentAccess } from "@/features/meeting-content/application/services/meeting-content-auth";
import { MeetingContentBottomNav } from "@/features/meeting-content/presentation/components/meeting-content-bottom-nav";
import { MeetingContentHeader } from "@/features/meeting-content/presentation/components/meeting-content-header";
import { MeetingContentSideNav } from "@/features/meeting-content/presentation/components/meeting-content-side-nav";

type Props = {
	children: ReactNode;
	params: Promise<{ slug: string }>;
};

export default async function MeetingContentLayout({
	children,
	params,
}: Props) {
	const { slug } = await params;
	const access = await getMeetingContentAccess(slug);

	if (!access) {
		notFound();
	}

	return (
		<div className="mx-auto w-full max-w-6xl space-y-5 pb-24 md:pb-8">
			<MeetingContentHeader />

			<div className="grid gap-5 md:grid-cols-[260px_minmax(0,1fr)] md:items-start">
				<aside className="md:sticky md:top-4">
					<div className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
						<MeetingContentSideNav slug={slug} />
					</div>
				</aside>

				<div className="min-w-0 space-y-5">{children}</div>
			</div>

			<MeetingContentBottomNav slug={slug} />
		</div>
	);
}
