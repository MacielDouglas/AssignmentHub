"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import type { PersonActionState } from "@/features/people/actions/person-action-state";
import { normalizePersonPayload } from "@/features/people/lib/normalize-person-payload";
import { parsePersonFormData } from "@/features/people/lib/person-form-data";
import { personFormSchema } from "@/features/people/schemas/person-form-schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const initialError = (message: string): PersonActionState => ({
	success: false,
	message,
});

export async function createPersonAction(
	_prevState: PersonActionState,
	formData: FormData,
): Promise<PersonActionState> {
	const parsed = personFormSchema.safeParse(parsePersonFormData(formData));

	if (!parsed.success) {
		return {
			success: false,
			message: "Dados inválidos.",
			fieldErrors: parsed.error.flatten().fieldErrors,
		};
	}

	const input = normalizePersonPayload(parsed.data);

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return initialError("Sessão inválida.");
	}

	const organization = await db.organizationMembership.findFirst({
		where: {
			userId: session.user.id,
			organization: { slug: input.slug },
			role: { in: ["OWNER", "ADMIN"] },
		},
		select: {
			organization: {
				select: { id: true, slug: true },
			},
		},
	});

	if (!organization) {
		return initialError("Você não tem permissão para criar pessoas.");
	}

	try {
		await db.$transaction(async (tx) => {
			const person = await tx.person.create({
				data: {
					organizationId: organization.organization.id,
					name: input.name,
					sex: input.sex,
					isActive: input.isActive,
					isStudent: input.isStudent,
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
					servicePrivilege: {
						create: {
							elder: input.elder,
							publicTalk: input.publicTalk,
							lifeAndMinistryChairman: input.lifeAndMinistryChairman,
							weekendChairman: input.weekendChairman,
							ourChristianLifeAssignment: input.ourChristianLifeAssignment,
							localNeeds: input.localNeeds,
							bibleStudyConductor: input.bibleStudyConductor,
							watchtowerConductor: input.watchtowerConductor,
						},
					},
				},
				select: { id: true },
			});

			if (input.isFamilyHead) {
				const familyName = input.familyName?.trim();

				if (!familyName) {
					throw new Error("Informe o nome da família.");
				}

				const family = await tx.family.create({
					data: {
						organizationId: organization.organization.id,
						name: familyName,
						headId: person.id,
					},
					select: { id: true },
				});

				await tx.person.update({
					where: { id: person.id },
					data: { familyId: family.id },
				});

				return;
			}

			if (input.familyId) {
				const family = await tx.family.findFirst({
					where: {
						id: input.familyId,
						organizationId: organization.organization.id,
					},
					select: { id: true },
				});

				if (!family) {
					throw new Error("Família inválida.");
				}

				await tx.person.update({
					where: { id: person.id },
					data: { familyId: family.id },
				});
			}
		});

		revalidatePath(`/org/${organization.organization.slug}/people`);

		return {
			success: true,
			message: "Pessoa criada com sucesso.",
		};
	} catch (error) {
		return initialError(
			error instanceof Error ? error.message : "Erro ao criar pessoa.",
		);
	}
}
