"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ScheduleItemFormState } from "../domain/schedule-settings.types";
import type { ScheduleType } from "../schemas/save-schedule-settings.schema";
import { ScheduleCleaningTab } from "./schedule-cleaning-tab";
import { ScheduleMeetingsTab } from "./schedule-meetings-tab";
import { ScheduleSpecialEventsTab } from "./schedule-special-events-tab";

type Props = {
	items: ScheduleItemFormState[];
	onItemChange: (type: ScheduleType, value: ScheduleItemFormState) => void;
	onAddNextYearMeeting: () => void;
	onResetItem: (type: ScheduleType) => void;
};

export function ScheduleSettingsTabs({
	items,
	onItemChange,
	onAddNextYearMeeting,
	onResetItem,
}: Props) {
	const [selectedTab, setSelectedTab] = useState("meetings");

	const meetings = items.find((item) => item.type === "MEETINGS");
	const specialMeeting = items.find((item) => item.type === "SPECIAL_MEETING");
	const weeklyCleaning = items.find((item) => item.type === "WEEKLY_CLEANING");
	const generalCleaning = items.find(
		(item) => item.type === "GENERAL_CLEANING",
	);

	if (!meetings || !specialMeeting || !weeklyCleaning || !generalCleaning) {
		return null;
	}

	const meetingItems = items.filter((item) => item.type === "MEETINGS");
	const nextYearMeeting = meetingItems.length > 1 ? meetingItems[1] : null;

	return (
		<Tabs
			value={selectedTab}
			onValueChange={setSelectedTab}
			className="space-y-4"
		>
			<div className="overflow-x-auto">
				<TabsList className="inline-flex min-w-full justify-start">
					<TabsTrigger value="meetings">Reuniões</TabsTrigger>
					<TabsTrigger value="cleaning">Limpeza</TabsTrigger>
					<TabsTrigger value="special-events">Eventos especiais</TabsTrigger>
				</TabsList>
			</div>

			<TabsContent value="meetings" className="mt-0">
				<ScheduleMeetingsTab
					meetings={meetings}
					specialMeeting={specialMeeting}
					nextYearMeeting={nextYearMeeting}
					onMeetingsChange={(value) => onItemChange("MEETINGS", value)}
					onSpecialMeetingChange={(value) =>
						onItemChange("SPECIAL_MEETING", value)
					}
					onAddNextYearMeeting={onAddNextYearMeeting}
					onNextYearMeetingChange={(value) => onItemChange("MEETINGS", value)}
					onResetMeetingItem={onResetItem}
				/>
			</TabsContent>

			<TabsContent value="cleaning" className="mt-0">
				<ScheduleCleaningTab
					weeklyCleaning={weeklyCleaning}
					generalCleaning={generalCleaning}
					onWeeklyCleaningChange={(value) =>
						onItemChange("WEEKLY_CLEANING", value)
					}
					onGeneralCleaningChange={(value) =>
						onItemChange("GENERAL_CLEANING", value)
					}
				/>
			</TabsContent>

			<TabsContent value="special-events" className="mt-0">
				<ScheduleSpecialEventsTab items={items} onItemChange={onItemChange} />
			</TabsContent>
		</Tabs>
	);
}
