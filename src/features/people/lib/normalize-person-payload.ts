import type { PersonFormInput } from "@/features/people/schemas/person-form-schema";

export function normalizePersonPayload(
	input: PersonFormInput,
): PersonFormInput {
	const isMale = input.sex === "MALE";
	const isMaleAndBaptized = isMale && input.baptized;

	return {
		...input,
		familyId: input.isFamilyHead ? undefined : input.familyId,
		familyName: input.isFamilyHead ? input.familyName?.trim() : undefined,

		bibleReading: isMale ? input.bibleReading : false,
		roamingMic: isMale ? input.roamingMic : false,
		sound: isMale ? input.sound : false,
		video: isMale ? input.video : false,
		stage: isMale ? input.stage : false,

		bibleStudyReader: isMaleAndBaptized ? input.bibleStudyReader : false,
		watchtowerReader: isMaleAndBaptized ? input.watchtowerReader : false,
		attendant: isMaleAndBaptized ? input.attendant : false,

		privilegePrayer: isMaleAndBaptized ? input.privilegePrayer : false,
		elder: isMaleAndBaptized ? input.elder : false,
		publicTalk: isMaleAndBaptized ? input.publicTalk : false,
		lifeAndMinistryChairman: isMaleAndBaptized
			? input.lifeAndMinistryChairman
			: false,
		weekendChairman: isMaleAndBaptized ? input.weekendChairman : false,
		ourChristianLifeAssignment: isMaleAndBaptized
			? input.ourChristianLifeAssignment
			: false,
		localNeeds: isMaleAndBaptized ? input.localNeeds : false,
		bibleStudyConductor: isMaleAndBaptized ? input.bibleStudyConductor : false,
		watchtowerConductor: isMaleAndBaptized ? input.watchtowerConductor : false,
	};
}
