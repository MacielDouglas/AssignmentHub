export type EligiblePersonSpeaker = {
	kind: "PERSON";
	id: string;
	name: string;
};

export type EligibleSubPersonSpeaker = {
	kind: "SUB_PERSON";
	id: string;
	name: string;
	subOrganizationId: string;
	subOrganizationName: string;
};

export interface SpeakerEligibilityRepository {
	findEligiblePerson(params: {
		organizationId: string;
		personId: string;
	}): Promise<EligiblePersonSpeaker | null>;

	findEligibleSubPerson(params: {
		organizationId: string;
		subPersonId: string;
	}): Promise<EligibleSubPersonSpeaker | null>;

	listEligibleSpeakers(params: {
		organizationId: string;
	}): Promise<Array<EligiblePersonSpeaker | EligibleSubPersonSpeaker>>;
}
