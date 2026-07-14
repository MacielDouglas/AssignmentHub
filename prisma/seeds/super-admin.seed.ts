import { Sex, SystemRole } from "@/generated/prisma/client";
import { logSeedStep, prisma } from "./utils";

export async function seedSuperAdmin() {
	const email = process.env.SEED_SUPER_ADMIN_EMAIL;
	const name = process.env.SEED_SUPER_ADMIN_NAME;

	if (!email || !name) {
		throw new Error("Defina SEED_SUPER_ADMIN_EMAIL e SEED_SUPER_ADMIN_NAME.");
	}

	logSeedStep("Verificando SUPER_ADMIN...");

	const existingSuperAdmin = await prisma.user.findFirst({
		where: { systemRole: SystemRole.SUPER_ADMIN },
		select: { id: true, email: true },
	});

	if (existingSuperAdmin && existingSuperAdmin.email !== email) {
		throw new Error("Já existe um SUPER_ADMIN com outro e-mail.");
	}

	const existingUser = await prisma.user.findUnique({
		where: { email },
		select: { id: true, personId: true },
	});

	if (existingUser) {
		await prisma.user.update({
			where: { id: existingUser.id },
			data: {
				name,
				emailVerified: true,
				systemRole: SystemRole.SUPER_ADMIN,
			},
		});

		if (!existingUser.personId) {
			const person = await prisma.person.create({
				data: {
					name,
					sex: Sex.MALE,
					isActive: true,
					isStudent: false,
					organizationId: null,
				},
				select: { id: true },
			});

			await prisma.user.update({
				where: { id: existingUser.id },
				data: {
					personId: person.id,
				},
			});
		}

		logSeedStep("SUPER_ADMIN atualizado.");
		return;
	}

	const person = await prisma.person.create({
		data: {
			name,
			sex: Sex.MALE,
			isActive: true,
			isStudent: false,
			organizationId: null,
		},
		select: { id: true },
	});

	await prisma.user.create({
		data: {
			id: crypto.randomUUID(),
			name,
			email,
			emailVerified: true,
			systemRole: SystemRole.SUPER_ADMIN,
			personId: person.id,
		},
	});

	logSeedStep("SUPER_ADMIN criado.");
}
