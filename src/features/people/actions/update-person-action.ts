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

export async function updatePersonAction(
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

	if (!input.personId) {
		return initialError("Pessoa inválida.");
	}

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
		return initialError("Você não tem permissão para editar pessoas.");
	}

	try {
		await db.$transaction(async (tx) => {
			const existingPerson = await tx.person.findFirst({
				where: {
					id: input.personId,
					organizationId: organization.organization.id,
				},
				select: {
					id: true,
					familyId: true,
					headedFamily: {
						select: {
							id: true,
							name: true,
						},
					},
					servicePrivilege: {
						select: {
							id: true,
						},
					},
				},
			});

			if (!existingPerson) {
				throw new Error("Pessoa não encontrada.");
			}

			if (!input.isFamilyHead && existingPerson.headedFamily) {
				throw new Error(
					"Não é possível remover a chefia enquanto existir família vinculada a esta pessoa como chefe.",
				);
			}

			let targetFamilyId: string | null = null;

			if (input.isFamilyHead) {
				const familyName = input.familyName?.trim();

				if (!familyName) {
					throw new Error("Informe o nome da família.");
				}

				if (existingPerson.headedFamily) {
					const updatedFamily = await tx.family.update({
						where: { id: existingPerson.headedFamily.id },
						data: { name: familyName },
						select: { id: true },
					});

					targetFamilyId = updatedFamily.id;
				} else {
					const createdFamily = await tx.family.create({
						data: {
							organizationId: organization.organization.id,
							name: familyName,
							headId: existingPerson.id,
						},
						select: { id: true },
					});

					targetFamilyId = createdFamily.id;
				}
			} else if (input.familyId) {
				const selectedFamily = await tx.family.findFirst({
					where: {
						id: input.familyId,
						organizationId: organization.organization.id,
					},
					select: { id: true },
				});

				if (!selectedFamily) {
					throw new Error("Família inválida.");
				}

				targetFamilyId = selectedFamily.id;
			}

			await tx.person.update({
				where: { id: existingPerson.id },
				data: {
					familyId: targetFamilyId,
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
				},
			});

			if (existingPerson.servicePrivilege) {
				await tx.servicePrivilege.update({
					where: { personId: existingPerson.id },
					data: {
						elder: input.elder,
						publicTalk: input.publicTalk,
						lifeAndMinistryChairman: input.lifeAndMinistryChairman,
						weekendChairman: input.weekendChairman,
						ourChristianLifeAssignment: input.ourChristianLifeAssignment,
						localNeeds: input.localNeeds,
						bibleStudyConductor: input.bibleStudyConductor,
						watchtowerConductor: input.watchtowerConductor,
					},
				});
			} else {
				await tx.servicePrivilege.create({
					data: {
						personId: existingPerson.id,
						elder: input.elder,
						publicTalk: input.publicTalk,
						lifeAndMinistryChairman: input.lifeAndMinistryChairman,
						weekendChairman: input.weekendChairman,
						ourChristianLifeAssignment: input.ourChristianLifeAssignment,
						localNeeds: input.localNeeds,
						bibleStudyConductor: input.bibleStudyConductor,
						watchtowerConductor: input.watchtowerConductor,
					},
				});
			}
		});

		revalidatePath(`/org/${organization.organization.slug}/people`);

		return {
			success: true,
			message: "Pessoa atualizada com sucesso.",
		};
	} catch (error) {
		return initialError(
			error instanceof Error ? error.message : "Erro ao atualizar pessoa.",
		);
	}
}
