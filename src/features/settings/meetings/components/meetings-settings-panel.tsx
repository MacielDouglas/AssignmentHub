import type { SpecialEventListItem } from "@/features/settings/meetings/components/settings-shell";
import { SpecialEventsSection } from "@/features/settings/meetings/components/special-events-section";
import type { SpeakerOption } from "@/features/settings/meetings/components/special-talk-form-dialog";
import { WeeklyMeetingsForm } from "@/features/settings/meetings/components/weekly-meetings-form";
import type { WeeklyMeetingsView } from "@/features/settings/meetings/lib/meeting-schedule";

type MeetingsSettingsPanelProps = {
	organizationSlug: string;
	canEdit: boolean;
	weekly: WeeklyMeetingsView;
	specialEvents: SpecialEventListItem[];
	speakers?: SpeakerOption[];
};

export function MeetingsSettingsPanel({
	organizationSlug,
	canEdit,
	weekly,
	specialEvents,
	speakers = [],
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
				speakers={speakers}
			/>
		</div>
	);
}
