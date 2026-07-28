import { getTranslations } from "next-intl/server";
import { HiOutlineCog6Tooth } from "react-icons/hi2";
import type { CleaningSettingsView } from "@/features/settings/cleaning/lib/cleaning-settings";
import { MeetingsSettingsPanel } from "@/features/settings/meetings/components/meetings-settings-panel";
import { SettingsTabs } from "@/features/settings/meetings/components/settings-tabs";
import type { WeeklyMeetingsView } from "@/features/settings/meetings/lib/meeting-schedule";
import type { SpecialEventType } from "@/features/settings/meetings/lib/special-event-meta";
import { CleaningSettingsPanel } from "../../cleaning/components/cleaning-settings-panel";

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
	cleaning: CleaningSettingsView;
};

export async function SettingsShell({
	organizationSlug,
	organizationName,
	canEdit,
	activeTab,
	weekly,
	cleaning,
	specialEvents,
}: SettingsShellProps) {
	const t = await getTranslations("SettingsShell");

	return (
		<main className="space-y-6">
			<header className="rounded-4xl border border-border bg-card p-5 shadow-sm sm:p-6">
				<div className="flex items-start gap-3">
					<div className="flex h-12 w-12 items-center justify-center rounded-4xl bg-primary text-primary-foreground shadow-md">
						<HiOutlineCog6Tooth className="h-6 w-6" />
					</div>
					<div className="space-y-1">
						<p className="text-label uppercase text-muted-foreground">
							{organizationName}
						</p>
						<h1 className="text-display text-foreground">{t("title")}</h1>
						<p className="max-w-2xl text-sm text-muted-foreground">
							{t("subtitle")}
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
				<CleaningSettingsPanel
					organizationSlug={organizationSlug}
					canEdit={canEdit}
					cleaning={cleaning}
				/>
			) : null}

			{activeTab === "assignments" ? (
				<section className="rounded-[28px] border border-dashed ...">
					<h2 className="text-title">{t("assignmentsTitle")}</h2>
					<p className="mt-2 text-sm ...">{t("assignmentsSoon")}</p>
				</section>
			) : null}
		</main>
	);
}
