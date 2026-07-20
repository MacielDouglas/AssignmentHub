import { HiOutlineCog6Tooth } from "react-icons/hi2";

import { MeetingsSettingsPanel } from "@/features/settings/components/meetings-settings-panel";
import { SettingsTabs } from "@/features/settings/components/settings-tabs";
import type { WeeklyMeetingsView } from "@/features/settings/lib/meeting-schedule";
import type { SpecialEventType } from "@/features/settings/lib/special-event-meta";

export type SpecialEventListItem = {
	id: string;
	type: SpecialEventType;
	typeLabel: string;
	startDate: string;
	endDate: string | null;
	time: string | null;
	location: string | null;
	notes: string | null;
	isAllDay: boolean;
};

type SettingsShellProps = {
	organizationSlug: string;
	organizationName: string;
	canEdit: boolean;
	activeTab: "meetings" | "cleaning" | "assignments";
	weekly: WeeklyMeetingsView;
	specialEvents: SpecialEventListItem[];
};

export function SettingsShell({
	organizationSlug,
	organizationName,
	canEdit,
	activeTab,
	weekly,
	specialEvents,
}: SettingsShellProps) {
	return (
		<main className="space-y-6">
			<header className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
				<div className="flex items-start gap-3">
					<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/20">
						<HiOutlineCog6Tooth className="h-6 w-6" />
					</div>
					<div className="space-y-1">
						<p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
							{organizationName}
						</p>
						<h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
							Configurações
						</h1>
						<p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
							Definições usadas em todo o app: reuniões, limpeza e designações.
						</p>
					</div>
				</div>
			</header>

			<SettingsTabs organizationSlug={organizationSlug} activeTab={activeTab} />

			{activeTab === "meetings" ? (
				<MeetingsSettingsPanel
					organizationSlug={organizationSlug}
					canEdit={canEdit}
					weekly={weekly}
					specialEvents={specialEvents}
				/>
			) : null}

			{activeTab === "cleaning" ? (
				<section className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
					<h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
						Configurações de limpeza
					</h2>
					<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
						Em breve. Esta aba usará as mesmas reuniões configuradas aqui.
					</p>
				</section>
			) : null}

			{activeTab === "assignments" ? (
				<section className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
					<h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
						Configurações de designações
					</h2>
					<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
						Em breve.
					</p>
				</section>
			) : null}
		</main>
	);
}
