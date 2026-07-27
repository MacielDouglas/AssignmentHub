import type {
	MeetingAssignmentRole,
	MeetingKind,
	MeetingProgramPartKind,
	MeetingProgramSectionCode,
} from "@/generated/prisma/client";

export type SerializableDate = string;

export type AssignmentDto = {
	id: string;
	role: MeetingAssignmentRole;
	sortOrder: number;
	assigneeName: string;
	source: "PERSON" | "SUB_PERSON" | "EXTERNAL";
	personId: string | null;
	subPersonId: string | null;
	externalName: string | null;
};

export type MeetingPartDto = {
	id: string;
	kind: MeetingProgramPartKind;
	sectionCode: MeetingProgramSectionCode | null;
	sortOrder: number;
	title: string;
	theme: string | null;
	durationMin: number | null;
	modality: string | null;
	source: string | null;
	songNumber: number | null;
	songTitle: string | null;
	customTitle: string | null;
	isDisabled: boolean;
	assignments: AssignmentDto[];
};

export type MeetingProgramDto = {
	id: string;
	kind: MeetingKind;
	status: "DRAFT" | "PUBLISHED";
	scheduledAt: SerializableDate | null;
	scheduledTime: string | null;
	isCancelled: boolean;
	cancellationReason: string | null;
	specialEventTitle: string | null;
	specialEventDate: SerializableDate | null;
	specialEventTime: string | null;
	specialEventLocation: string | null;
	specialEventNotes: string | null;
	parts: MeetingPartDto[];
};

export type CandidateHistoryDto = {
	lastSameKindAt: SerializableDate | null;
	lastAnyAssignmentAt: SerializableDate | null;
	sameKindCount: number;
	totalCount: number;
};

export type MeetingCandidateDto = {
	id: string;
	kind: "PERSON" | "SUB_PERSON";
	name: string;
	subtitle: string | null;
	sex: "MALE" | "FEMALE";
	familyId: string | null;
	hasSameDayAssignment: boolean;
	history: CandidateHistoryDto;
};

export type AssignmentDialogDataDto = {
	partId: string;
	partKind: MeetingProgramPartKind;
	title: string;
	roles: MeetingAssignmentRole[];
	candidates: MeetingCandidateDto[];
	canUseExternalName: boolean;
};

export type MeetingWeekDto = {
	organizationName: string;
	organizationSlug: string;
	weekStart: SerializableDate;
	weekEnd: SerializableDate;
	locale: "pt" | "es";
	canManage: boolean;
	midweek: MeetingProgramDto;
	weekend: MeetingProgramDto;
};
