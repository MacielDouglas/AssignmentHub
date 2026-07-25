import { db } from "@/lib/db";

import type {
	EligiblePersonSpeaker,
	EligibleSubPersonSpeaker,
	SpeakerEligibilityRepository,
} from "../../domain/repositories/speaker-eligibility.repository";

export class SpeakerEligibilityPrismaRepository
	implements SpeakerEligibilityRepository
{
	async findEligiblePerson(params: {
		organizationId: string;
		personId: string;
	}): Promise<EligiblePersonSpeaker | null> {
		const person = await db.person.findFirst({
			where: {
				id: params.personId,
				organizationId: params.organizationId,
				isActive: true,
				servicePrivilege: {
					is: {
						publicTalk: true,
					},
				},
			},
			select: {
				id: true,
				name: true,
			},
		});

		if (!person) {
			return null;
		}

		return {
			kind: "PERSON",
			id: person.id,
			name: person.name,
		};
	}

	async findEligibleSubPerson(params: {
		organizationId: string;
		subPersonId: string;
	}): Promise<EligibleSubPersonSpeaker | null> {
		const subPerson = await db.subPerson.findFirst({
			where: {
				id: params.subPersonId,
				isActive: true,
				publicTalk: true,
				subOrganization: {
					organizationId: params.organizationId,
				},
			},
			select: {
				id: true,
				name: true,
				subOrganizationId: true,
				subOrganization: {
					select: {
						name: true,
					},
				},
			},
		});

		if (!subPerson) {
			return null;
		}

		return {
			kind: "SUB_PERSON",
			id: subPerson.id,
			name: subPerson.name,
			subOrganizationId: subPerson.subOrganizationId,
			subOrganizationName: subPerson.subOrganization.name,
		};
	}

	async listEligibleSpeakers(params: {
		organizationId: string;
	}): Promise<Array<EligiblePersonSpeaker | EligibleSubPersonSpeaker>> {
		const [people, subPeople] = await Promise.all([
			db.person.findMany({
				where: {
					organizationId: params.organizationId,
					isActive: true,
					servicePrivilege: {
						is: {
							publicTalk: true,
						},
					},
				},
				orderBy: [{ name: "asc" }],
				select: {
					id: true,
					name: true,
				},
			}),
			db.subPerson.findMany({
				where: {
					isActive: true,
					publicTalk: true,
					subOrganization: {
						organizationId: params.organizationId,
					},
				},
				orderBy: [{ name: "asc" }],
				select: {
					id: true,
					name: true,
					subOrganizationId: true,
					subOrganization: {
						select: {
							name: true,
						},
					},
				},
			}),
		]);

		return [
			...people.map(
				(person): EligiblePersonSpeaker => ({
					kind: "PERSON",
					id: person.id,
					name: person.name,
				}),
			),
			...subPeople.map(
				(subPerson): EligibleSubPersonSpeaker => ({
					kind: "SUB_PERSON",
					id: subPerson.id,
					name: subPerson.name,
					subOrganizationId: subPerson.subOrganizationId,
					subOrganizationName: subPerson.subOrganization.name,
				}),
			),
		];
	}
}
