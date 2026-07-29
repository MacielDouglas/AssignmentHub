import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MeetingsBottomNav } from "@/features/meetings/presentation/components/meetings-bottom-nav";
import { MeetingsHeader } from "@/features/meetings/presentation/components/meetings-header";
import { MeetingsSideNav } from "@/features/meetings/presentation/components/meetings-side-nav";

export const metadata: Metadata = {
	title: "Reuniões",
	description: "Programação e designações das reuniões da congregação.",
	robots: {
		index: false,
		follow: false,
	},
};

type Props = {
	children: ReactNode;
	params: Promise<{ slug: string }>;
};

export default async function MeetingsLayout({ children, params }: Props) {
	const { slug } = await params;

	return (
		<div className="mx-auto w-full max-w-6xl space-y-5 pb-24 md:pb-8">
			<MeetingsHeader />

			<div className="grid gap-5 md:grid-cols-[260px_minmax(0,1fr)] md:items-start">
				<aside className="md:sticky md:top-4">
					<div className="rounded-[28px] border border-border bg-card p-3 shadow-sm">
						<MeetingsSideNav slug={slug} />
					</div>
				</aside>

				<div className="min-w-0 space-y-5">{children}</div>
			</div>

			<MeetingsBottomNav slug={slug} />
		</div>
	);
}
