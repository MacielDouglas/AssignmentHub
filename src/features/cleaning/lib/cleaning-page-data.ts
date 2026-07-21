import type {
	EligiblePerson,
	FairnessHistory,
} from "@/features/cleaning/lib/roster-types";
import type { CleaningType, Weekday } from "@/generated/prisma/client";

export type SavedListSummary = {
	id: string;
	cleaningType: CleaningType;
	periodFrom: string;
	periodTo: string;
	status: "DRAFT" | "SAVED";
	dayCount: number;
};

export type CleaningPageData = {
	organizationId: string;
	organizationSlug: string;
	canManage: boolean;
	currentPersonId: string | null;
	cleaningSettings: {
		settingsId: string;
		types: Array<{
			type: CleaningType;
			configId: string;
			enabled: boolean;
			assignmentMode: string | null;
			followVisitSuppression: boolean;
			weekdays: Weekday[];
			timesPerWeek: number | null;
			dates: Array<{ id: string; date: string; label: string | null }>;
			sectors: Array<{
				id: string;
				name: string;
				description: string | null;
				peopleRequired: number | null;
				allowYoung: boolean;
				targetSex: "MALE" | "FEMALE" | null;
				sortOrder: number;
				isActive: boolean;
				assignmentCount: number;
			}>;
			allowedModes: string[];
		}>;
	};
	weeklyMeetings: {
		current: {
			scheduleId: string | null;
			effectiveFrom: string | null;
			effectiveUntil: string | null;
			slots: Array<{ weekday: Weekday; time: string }>;
		};
		nextYear: {
			year: number;
			scheduleId: string | null;
			slots: Array<{ weekday: Weekday; time: string }>;
		};
	};
	people: EligiblePerson[];
	history: FairnessHistory;
	savedLists: SavedListSummary[];
};
