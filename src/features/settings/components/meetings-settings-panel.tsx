import type { SpecialEventListItem } from "@/features/settings/components/settings-shell";
import { SpecialEventsSection } from "@/features/settings/components/special-events-section";
import { WeeklyMeetingsForm } from "@/features/settings/components/weekly-meetings-form";
import type { WeeklyMeetingsView } from "@/features/settings/lib/meeting-schedule";

type MeetingsSettingsPanelProps = {
	organizationSlug: string;
	canEdit: boolean;
	weekly: WeeklyMeetingsView;
	specialEvents: SpecialEventListItem[];
};

export function MeetingsSettingsPanel({
	organizationSlug,
	canEdit,
	weekly,
	specialEvents,
}: MeetingsSettingsPanelProps) {
	return (
		<div className="space-y-6">
			<WeeklyMeetingsForm
				organizationSlug={organizationSlug}
				canEdit={canEdit}
				weekly={weekly}
			/>
			<SpecialEventsSection
				organizationSlug={organizationSlug}
				canEdit={canEdit}
				events={specialEvents}
			/>
		</div>
	);
}
