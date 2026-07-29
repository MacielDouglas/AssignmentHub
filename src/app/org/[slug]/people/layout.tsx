import type { ReactNode } from "react";

import { PeopleHeader } from "@/features/people/components/people-header";

type Props = {
	children: ReactNode;
	params: Promise<{ slug: string }>;
};

export default async function PeopleLayout({ children }: Props) {
	return (
		<div className="mx-auto w-full max-w-6xl space-y-5 pb-24 md:pb-8">
			<PeopleHeader />

			<div className="min-w-0 space-y-5">{children}</div>
		</div>
	);
}
