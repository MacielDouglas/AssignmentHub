import Link from "next/link";

const TABS = [
	{ id: "meetings", label: "Reuniões" },
	{ id: "cleaning", label: "Limpeza" },
	{ id: "assignments", label: "Designações" },
] as const;

type SettingsTabsProps = {
	organizationSlug: string;
	activeTab: "meetings" | "cleaning" | "assignments";
};

export function SettingsTabs({
	organizationSlug,
	activeTab,
}: SettingsTabsProps) {
	return (
		<nav
			aria-label="Seções de configuração"
			className="flex gap-2 overflow-x-auto rounded-[24px] border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950"
		>
			{TABS.map((tab) => {
				const active = tab.id === activeTab;
				return (
					<Link
						key={tab.id}
						href={`/org/${organizationSlug}/settings?tab=${tab.id}`}
						className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
							active
								? "bg-linear-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-600/20"
								: "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
						}`}
					>
						{tab.label}
					</Link>
				);
			})}
		</nav>
	);
}
