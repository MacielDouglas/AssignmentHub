import type {
	MeetingAssignmentRole,
	MeetingProgramPartKind,
	Sex,
} from "@/generated/prisma/client";

type PersonFlag =
	| "bibleReading"
	| "initiatingConversations"
	| "cultivatingInterest"
	| "makingDisciples"
	| "explainingBeliefs"
	| "bibleStudyReader"
	| "watchtowerReader"
	| "privilegePrayer";

type PrivilegeFlag =
	| "lifeAndMinistryChairman"
	| "weekendChairman"
	| "treasuresFromGodsWordTalk"
	| "spiritualGems"
	| "ourChristianLifeAssignment"
	| "localNeeds"
	| "bibleStudyConductor"
	| "watchtowerConductor"
	| "publicTalk";

export type MeetingPartMeta = {
	roles: MeetingAssignmentRole[];
	sex?: Sex;
	requiresBaptized?: boolean;
	personFlag?: PersonFlag;
	privilegeFlag?: PrivilegeFlag;
	allowSubPerson?: boolean;
	allowExternalName?: boolean;
};

const PRIMARY: MeetingAssignmentRole[] = ["PRIMARY"];

export const MEETING_PART_META: Partial<
	Record<MeetingProgramPartKind, MeetingPartMeta>
> = {
	MIDWEEK_CHAIRMAN: {
		roles: ["CHAIRMAN"],
		sex: "MALE",
		requiresBaptized: true,
		privilegeFlag: "lifeAndMinistryChairman",
	},

	MIDWEEK_TREASURES_TALK: {
		roles: PRIMARY,
		sex: "MALE",
		requiresBaptized: true,
		privilegeFlag: "treasuresFromGodsWordTalk",
	},

	MIDWEEK_SPIRITUAL_GEMS: {
		roles: PRIMARY,
		sex: "MALE",
		requiresBaptized: true,
		privilegeFlag: "spiritualGems",
	},

	MIDWEEK_BIBLE_READING: {
		roles: ["READER"],
		sex: "MALE",
		personFlag: "bibleReading",
	},

	MIDWEEK_MINISTRY_INITIATING_CONVERSATION: {
		roles: ["PRIMARY", "ASSISTANT"],
		personFlag: "initiatingConversations",
	},

	MIDWEEK_MINISTRY_CULTIVATING_INTEREST: {
		roles: ["PRIMARY", "ASSISTANT"],
		personFlag: "cultivatingInterest",
	},

	MIDWEEK_MINISTRY_MAKING_DISCIPLES: {
		roles: ["PRIMARY", "ASSISTANT"],
		personFlag: "makingDisciples",
	},

	MIDWEEK_MINISTRY_EXPLAINING_BELIEFS: {
		roles: ["PRIMARY", "ASSISTANT"],
		personFlag: "explainingBeliefs",
	},

	MIDWEEK_MINISTRY_TALK: {
		roles: PRIMARY,
		sex: "MALE",
		requiresBaptized: true,
		privilegeFlag: "ourChristianLifeAssignment",
	},

	MIDWEEK_LIVING_PART: {
		roles: PRIMARY,
		sex: "MALE",
		requiresBaptized: true,
		privilegeFlag: "ourChristianLifeAssignment",
	},

	MIDWEEK_ORGANIZATION_ACCOMPLISHMENTS: {
		roles: PRIMARY,
		sex: "MALE",
		requiresBaptized: true,
		privilegeFlag: "ourChristianLifeAssignment",
	},

	MIDWEEK_BIBLE_STUDY: {
		roles: ["CONDUCTOR", "READER"],
		sex: "MALE",
		requiresBaptized: true,
		privilegeFlag: "bibleStudyConductor",
	},

	MIDWEEK_SERVICE_TALK: {
		roles: PRIMARY,
		sex: "MALE",
		requiresBaptized: true,
		privilegeFlag: "localNeeds",
		allowExternalName: true,
	},

	MIDWEEK_CLOSING_SONG_AND_PRAYER: {
		roles: ["PRAYER"],
		sex: "MALE",
		requiresBaptized: true,
		personFlag: "privilegePrayer",
	},

	WEEKEND_CHAIRMAN: {
		roles: ["CHAIRMAN"],
		sex: "MALE",
		requiresBaptized: true,
		privilegeFlag: "weekendChairman",
	},

	WEEKEND_PUBLIC_TALK: {
		roles: ["SPEAKER"],
		sex: "MALE",
		requiresBaptized: true,
		privilegeFlag: "publicTalk",
		allowSubPerson: true,
		allowExternalName: true,
	},

	WEEKEND_WATCHTOWER_STUDY: {
		roles: ["CONDUCTOR", "READER"],
		sex: "MALE",
		requiresBaptized: true,
		privilegeFlag: "watchtowerConductor",
	},

	WEEKEND_CLOSING_SONG_AND_PRAYER: {
		roles: ["PRAYER"],
		sex: "MALE",
		requiresBaptized: true,
		personFlag: "privilegePrayer",
	},

	WEEKEND_CIRCUIT_OVERSEER_FINAL_TALK: {
		roles: ["SPEAKER"],
		sex: "MALE",
		requiresBaptized: true,
		allowExternalName: true,
	},
};

export function getMeetingPartMeta(kind: MeetingProgramPartKind) {
	return MEETING_PART_META[kind] ?? null;
}

export function isAssignableMeetingPart(kind: MeetingProgramPartKind) {
	return getMeetingPartMeta(kind) !== null;
}
