"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ScheduleItemFormState, ScheduleLeaderOption } from "../domain/schedule-settings.types";
import type {
	ScheduleType,
	ScheduleVariant,
} from "../schemas/save-schedule-settings.schema";
import { ScheduleCleaningTab } from "./schedule-cleaning-tab";
import { ScheduleMeetingsTab } from "./schedule-meetings-tab";
import { ScheduleSpecialEventsTab } from "./schedule-special-events-tab";

type Props = {
	items: ScheduleItemFormState[];
	pending: boolean;
	onSubmitSection: () => void;
	onItemChange: (
		type: ScheduleType,
		variant: ScheduleVariant,
		value: ScheduleItemFormState,
	) => void;
	onAddNextYearMeeting: () => void;
	onRemoveNextYearMeeting: () => void;
	onResetItem: (type: ScheduleType, variant?: ScheduleVariant) => void;
	leaders: ScheduleLeaderOption[];
};

export function ScheduleSettingsTabs({
	items,
	pending,
	onSubmitSection,
	onItemChange,
	onAddNextYearMeeting,
	onRemoveNextYearMeeting,
	onResetItem,
	leaders,
}: Props) {
	const [selectedTab, setSelectedTab] = useState("meetings");

	const meetings = useMemo(
		() =>
			items.find(
				(item) => item.type === "MEETINGS" && item.variant === "DEFAULT",
			),
		[items],
	);

	const nextYearMeeting = useMemo(
		() =>
			items.find(
				(item) => item.type === "MEETINGS" && item.variant === "NEXT_YEAR",
			) ?? null,
		[items],
	);

	const specialMeeting = useMemo(
		() =>
			items.find(
				(item) => item.type === "SPECIAL_MEETING" && item.variant === "DEFAULT",
			),
		[items],
	);

	const weeklyCleaning = useMemo(
		() =>
			items.find(
				(item) => item.type === "WEEKLY_CLEANING" && item.variant === "DEFAULT",
			),
		[items],
	);

	const generalCleaning = useMemo(
		() =>
			items.find(
				(item) =>
					item.type === "GENERAL_CLEANING" && item.variant === "DEFAULT",
			),
		[items],
	);

	if (!meetings || !specialMeeting || !weeklyCleaning || !generalCleaning) {
		return null;
	}

	return (
		<Tabs
			value={selectedTab}
			onValueChange={setSelectedTab}
			className="space-y-5"
		>
			<div className="overflow-x-auto">
				<TabsList className="inline-flex min-w-full justify-start rounded-2xl border border-border/60 bg-muted/40 p-1">
					<TabsTrigger value="meetings" className="rounded-xl">
						Reuniões
					</TabsTrigger>
					<TabsTrigger value="cleaning" className="rounded-xl">
						Limpeza
					</TabsTrigger>
					<TabsTrigger value="special-events" className="rounded-xl">
						Eventos especiais
					</TabsTrigger>
				</TabsList>
			</div>

			<TabsContent value="meetings" className="mt-0">
				<ScheduleMeetingsTab
					meetings={meetings}
					specialMeeting={specialMeeting}
					nextYearMeeting={nextYearMeeting}
					pending={pending}
					onSubmitSection={onSubmitSection}
					onMeetingsChange={(value) =>
						onItemChange("MEETINGS", "DEFAULT", value)
					}
					onSpecialMeetingChange={(value) =>
						onItemChange("SPECIAL_MEETING", "DEFAULT", value)
					}
					onAddNextYearMeeting={onAddNextYearMeeting}
					onRemoveNextYearMeeting={onRemoveNextYearMeeting}
					onNextYearMeetingChange={(value) =>
						onItemChange("MEETINGS", "NEXT_YEAR", value)
					}
					onResetMeetingItem={(type, variant = "DEFAULT") =>
						onResetItem(type, variant)
					}
					leaders={leaders}
				/>
			</TabsContent>

			<TabsContent value="cleaning" className="mt-0">
				<ScheduleCleaningTab
					weeklyCleaning={weeklyCleaning}
					generalCleaning={generalCleaning}
					pending={pending}
					onSubmitSection={onSubmitSection}
					onWeeklyCleaningChange={(value) =>
						onItemChange("WEEKLY_CLEANING", "DEFAULT", value)
					}
					onGeneralCleaningChange={(value) =>
						onItemChange("GENERAL_CLEANING", "DEFAULT", value)
					}
					leaders={leaders}
				/>
			</TabsContent>

			<TabsContent value="special-events" className="mt-0">
				<ScheduleSpecialEventsTab
					items={items}
					pending={pending}
					onSubmitSection={onSubmitSection}
					onItemChange={onItemChange}
					leaders={leaders}
				/>
			</TabsContent>
		</Tabs>
	);
}
