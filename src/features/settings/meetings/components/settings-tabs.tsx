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
			className="flex gap-2 overflow-x-auto rounded-[24px] border ..."
		>
			{TAB_IDS.map((id) => {
				const active = id === activeTab;
				return (
					<Link
						key={id}
						href={`/org/${organizationSlug}/settings?tab=${id}`}
						className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
							active
								? "bg-linear-to-r from-blue-600 to-violet-600 text-white shadow-md"
								: "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
						}`}
					>
						{labels[id]}
					</Link>
				);
			})}
		</nav>
	);
}
