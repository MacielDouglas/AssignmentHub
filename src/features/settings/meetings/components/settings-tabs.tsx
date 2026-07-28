"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

const TAB_IDS = ["meetings", "cleaning", "assignments"] as const;

export function SettingsTabs({
	organizationSlug,
	activeTab,
}: {
	organizationSlug: string;
	activeTab: (typeof TAB_IDS)[number];
}) {
	const t = useTranslations("SettingsShell");

	const labels = {
		meetings: t("tabMeetings"),
		cleaning: t("tabCleaning"),
		assignments: t("tabAssignments"),
	} as const;

	return (
		<nav
			aria-label={t("navAria")}
			className="flex gap-2 overflow-x-auto rounded-3xl border border-border"
		>
			{TAB_IDS.map((id) => {
				const active = id === activeTab;
				return (
					<Link
						key={id}
						href={`/org/${organizationSlug}/settings?tab=${id}`}
						className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
							active
								? "bg-primary text-primary-foreground shadow-md"
								: "text-muted-foreground hover:bg-muted"
						}`}
					>
						{labels[id]}
					</Link>
				);
			})}
		</nav>
	);
}
