import type { Prisma, Sex } from "@/generated/prisma/client";
import { db } from "@/lib/db";

type Tx = Prisma.TransactionClient;

type Access = {
	organizationId: string;
	slug: string;
};

export type ManagedPersonInput = {
	personId?: string;
	name: string;
	sex: Sex;
	isActive: boolean;
	isStudent: boolean;

	isFamilyHead: boolean;
	familyName?: string;
	familyId?: string;

	headRemovalAction?: "REASSIGN" | "DISSOLVE";
	newHeadPersonId?: string;

	baptized: boolean;
	young: boolean;
	isMarried: boolean;

	initiatingConversations: boolean;
	cultivatingInterest: boolean;
	makingDisciples: boolean;
	explainingBeliefs: boolean;
	cleaning: boolean;
	privilegePrayer: boolean;

	bibleReading: boolean;
	roamingMic: boolean;
	sound: boolean;
	video: boolean;
	stage: boolean;
	bibleStudyReader: boolean;
	watchtowerReader: boolean;
	attendant: boolean;

	elder: boolean;
	publicTalk: boolean;
	lifeAndMinistryChairman: boolean;
	weekendChairman: boolean;
	ourChristianLifeAssignment: boolean;
	localNeeds: boolean;
	bibleStudyConductor: boolean;
	watchtowerConductor: boolean;
};

type NormalizedManagedPersonInput = ManagedPersonInput & {
	name: string;
	familyName?: string;
};

export async function requirePeopleManager(slug: string, userId: string) {
	const membership = await db.organizationMembership.findFirst({
		where: {
			userId,
			organization: { slug },
			role: { in: ["OWNER", "ADMIN"] },
		},
		select: {
			organization: {
				select: { id: true, slug: true },
			},
		},
	});

	if (!membership) {
		throw new Error("Você não tem permissão para gerenciar pessoas.");
	}

	return {
		organizationId: membership.organization.id,
		slug: membership.organization.slug,
	};
}

function normalizePersonInput(
	input: ManagedPersonInput,
): NormalizedManagedPersonInput {
	const name = input.name.trim().replace(/\s+/g, " ");
	const familyName = input.familyName?.trim().replace(/\s+/g, " ");

	const isMale = input.sex === "MALE";
	const isMaleAndBaptized = isMale && input.baptized;
	const isYoung = input.young;

	return {
		...input,
		name,
		familyName,
		isMarried: isYoung ? false : input.isMarried,

		initiatingConversations: input.initiatingConversations,
		cultivatingInterest: input.cultivatingInterest,
		makingDisciples: input.makingDisciples,
		explainingBeliefs: input.explainingBeliefs,
		cleaning: input.cleaning,

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

async function ensureFamilyBelongsToOrg(
	tx: Tx,
	familyId: string,
	organizationId: string,
) {
	const family = await tx.family.findFirst({
		where: { id: familyId, organizationId },
		select: { id: true, name: true, headId: true },
	});

	if (!family) {
		throw new Error("Família inválida.");
	}

	return family;
}

async function ensurePersonBelongsToOrg(
	tx: Tx,
	personId: string,
	organizationId: string,
) {
	const person = await tx.person.findFirst({
		where: { id: personId, organizationId },
		select: {
			id: true,
			name: true,
			sex: true,
			familyId: true,
			spouseId: true,
			isMarried: true,
			young: true,
			headedFamily: { select: { id: true, name: true } },
			user: { select: { id: true } },
			servicePrivilege: { select: { id: true } },
		},
	});

	if (!person) {
		throw new Error("Pessoa não encontrada.");
	}

	return person;
}

async function clearMarriage(tx: Tx, personId: string) {
	const person = await tx.person.findUnique({
		where: { id: personId },
		select: { id: true, spouseId: true },
	});

	if (!person) return;

	const spouseId = person.spouseId ?? null;

	await tx.person.update({
		where: { id: personId },
		data: { isMarried: false, spouseId: null },
	});

	if (spouseId) {
		await tx.person.updateMany({
			where: { id: spouseId, spouseId: personId },
			data: { isMarried: false, spouseId: null },
		});
	}
}

async function dissolveFamily(tx: Tx, familyId: string) {
	const members = await tx.person.findMany({
		where: {
			OR: [{ familyId }, { headedFamily: { id: familyId } }],
		},
		select: { id: true },
	});

	for (const member of members) {
		await clearMarriage(tx, member.id);
	}

	await tx.person.updateMany({
		where: { familyId },
		data: { familyId: null },
	});

	await tx.family.delete({
		where: { id: familyId },
	});
}

async function syncFamilyMarriage(tx: Tx, familyId: string | null) {
	if (!familyId) return;

	const members = await tx.person.findMany({
		where: { familyId },
		orderBy: { name: "asc" },
		select: {
			id: true,
			sex: true,
			young: true,
			isMarried: true,
			spouseId: true,
		},
	});

	const eligible = members.filter(
		(person) => !person.young && person.isMarried,
	);

	if (eligible.length !== 2) {
		for (const person of members) {
			if (person.isMarried || person.spouseId) {
				await tx.person.update({
					where: { id: person.id },
					data: { isMarried: false, spouseId: null },
				});
			}
		}
		return;
	}

	const [first, second] = eligible;

	if (first.sex === second.sex) {
		throw new Error(
			"Uma família só pode ter duas pessoas casadas, adultas e de sexos diferentes.",
		);
	}

	const invalidOthers = members.filter(
		(person) =>
			person.id !== first.id &&
			person.id !== second.id &&
			(person.isMarried || person.spouseId),
	);

	for (const person of invalidOthers) {
		await tx.person.update({
			where: { id: person.id },
			data: { isMarried: false, spouseId: null },
		});
	}

	await tx.person.update({
		where: { id: first.id },
		data: { isMarried: true, spouseId: second.id },
	});

	await tx.person.update({
		where: { id: second.id },
		data: { isMarried: true, spouseId: first.id },
	});
}

function buildPersonData(
	input: NormalizedManagedPersonInput,
	organizationId: string,
	familyId: string | null,
) {
	return {
		organizationId,
		familyId,
		name: input.name,
		sex: input.sex,
		isActive: input.isActive,
		isStudent: input.isStudent,
		isMarried: input.isMarried,
		baptized: input.baptized,
		young: input.young,
		initiatingConversations: input.initiatingConversations,
		cultivatingInterest: input.cultivatingInterest,
		makingDisciples: input.makingDisciples,
		explainingBeliefs: input.explainingBeliefs,
		cleaning: input.cleaning,
		privilegePrayer: input.privilegePrayer,
		bibleReading: input.bibleReading,
		roamingMic: input.roamingMic,
		sound: input.sound,
		video: input.video,
		stage: input.stage,
		bibleStudyReader: input.bibleStudyReader,
		watchtowerReader: input.watchtowerReader,
		attendant: input.attendant,
	};
}

function buildServicePrivilegeData(input: NormalizedManagedPersonInput) {
	return {
		elder: input.elder,
		publicTalk: input.publicTalk,
		lifeAndMinistryChairman: input.lifeAndMinistryChairman,
		weekendChairman: input.weekendChairman,
		ourChristianLifeAssignment: input.ourChristianLifeAssignment,
		localNeeds: input.localNeeds,
		bibleStudyConductor: input.bibleStudyConductor,
		watchtowerConductor: input.watchtowerConductor,
	};
}

export async function createOrUpdatePerson(
	tx: Tx,
	access: Access,
	rawInput: ManagedPersonInput,
) {
	const input = normalizePersonInput(rawInput);

	if (!input.name) {
		throw new Error("Informe o nome da pessoa.");
	}

	let targetFamilyId: string | null = null;
	let previousFamilyId: string | null = null;
	const ensuredFamilyName = input.familyName?.trim();

	if (input.personId) {
		const current = await ensurePersonBelongsToOrg(
			tx,
			input.personId,
			access.organizationId,
		);
		previousFamilyId = current.familyId ?? current.headedFamily?.id ?? null;
	}

	if (input.isFamilyHead) {
		if (!ensuredFamilyName) {
			throw new Error("Informe o nome da família.");
		}
	} else if (input.familyId) {
		const family = await ensureFamilyBelongsToOrg(
			tx,
			input.familyId,
			access.organizationId,
		);
		targetFamilyId = family.id;
	}

	if (input.isMarried && !input.isFamilyHead && !targetFamilyId) {
		throw new Error("Pessoa casada precisa pertencer a uma família.");
	}

	if (input.personId) {
		const current = await ensurePersonBelongsToOrg(
			tx,
			input.personId,
			access.organizationId,
		);

		if (
			current.isMarried &&
			previousFamilyId &&
			previousFamilyId !== targetFamilyId
		) {
			await clearMarriage(tx, current.id);
		}

		await tx.person.update({
			where: { id: current.id },
			data: buildPersonData(input, access.organizationId, targetFamilyId),
		});

		if (current.servicePrivilege) {
			await tx.servicePrivilege.update({
				where: { personId: current.id },
				data: buildServicePrivilegeData(input),
			});
		} else {
			await tx.servicePrivilege.create({
				data: {
					personId: current.id,
					...buildServicePrivilegeData(input),
				},
			});
		}

		if (input.isFamilyHead) {
			const existingHeadedFamily = current.headedFamily;

			if (!ensuredFamilyName) {
				throw new Error("Informe o nome da família.");
			}

			if (existingHeadedFamily) {
				await tx.family.update({
					where: { id: existingHeadedFamily.id },
					data: { name: ensuredFamilyName },
				});
				targetFamilyId = existingHeadedFamily.id;
			} else {
				const createdFamily = await tx.family.create({
					data: {
						organizationId: access.organizationId,
						name: ensuredFamilyName,
						headId: current.id,
					},
					select: { id: true },
				});

				targetFamilyId = createdFamily.id;

				await tx.person.update({
					where: { id: current.id },
					data: { familyId: createdFamily.id },
				});
			}
		}

		if (!input.isFamilyHead && current.headedFamily) {
			throw new Error(
				"Use a ação específica de chefia para remover ou transferir o chefe da família.",
			);
		}

		await syncFamilyMarriage(tx, previousFamilyId);
		await syncFamilyMarriage(tx, targetFamilyId);
		return;
	}

	const created = await tx.person.create({
		data: buildPersonData(input, access.organizationId, targetFamilyId),
		select: { id: true },
	});

	await tx.servicePrivilege.create({
		data: {
			personId: created.id,
			...buildServicePrivilegeData(input),
		},
	});

	if (input.isFamilyHead) {
		if (!ensuredFamilyName) {
			throw new Error("Informe o nome da família.");
		}

		const createdFamily = await tx.family.create({
			data: {
				organizationId: access.organizationId,
				name: ensuredFamilyName,
				headId: created.id,
			},
			select: { id: true },
		});

		targetFamilyId = createdFamily.id;

		await tx.person.update({
			where: { id: created.id },
			data: { familyId: createdFamily.id },
		});
	}

	await syncFamilyMarriage(tx, targetFamilyId);
}
export async function removeFamilyHeadWithDecision(
	tx: Tx,
	access: Access,
	personId: string,
	decision: "REASSIGN" | "DISSOLVE",
	newHeadPersonId?: string,
) {
	const person = await ensurePersonBelongsToOrg(
		tx,
		personId,
		access.organizationId,
	);

	if (!person.headedFamily) {
		throw new Error("Essa pessoa não é chefe de família.");
	}

	const family = await ensureFamilyBelongsToOrg(
		tx,
		person.headedFamily.id,
		access.organizationId,
	);

	if (decision === "DISSOLVE") {
		await dissolveFamily(tx, family.id);
		return;
	}

	if (!newHeadPersonId) {
		throw new Error("Selecione o novo chefe da família.");
	}

	if (newHeadPersonId === personId) {
		throw new Error("Selecione outra pessoa como novo chefe.");
	}

	const newHead = await ensurePersonBelongsToOrg(
		tx,
		newHeadPersonId,
		access.organizationId,
	);

	if (newHead.familyId !== family.id) {
		throw new Error("O novo chefe precisa pertencer à mesma família.");
	}

	await tx.family.update({
		where: { id: family.id },
		data: { headId: newHead.id },
	});

	await syncFamilyMarriage(tx, family.id);
}

export async function deletePersonWithRules(
	tx: Tx,
	access: Access,
	personId: string,
) {
	const person = await ensurePersonBelongsToOrg(
		tx,
		personId,
		access.organizationId,
	);

	if (person.user) {
		throw new Error("Não é permitido deletar pessoa com usuário vinculado.");
	}

	const familyId = person.familyId ?? person.headedFamily?.id ?? null;

	if (person.isMarried || person.spouseId) {
		await clearMarriage(tx, person.id);
	}

	if (person.headedFamily) {
		await dissolveFamily(tx, person.headedFamily.id);
	}

	await tx.person.delete({
		where: { id: person.id },
	});

	await syncFamilyMarriage(tx, familyId);
}
