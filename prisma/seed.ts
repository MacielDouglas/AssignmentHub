import { Sex, SystemRole } from "@/generated/prisma/client";
import { db } from "@/lib/db";

const prisma = db;

async function main() {
	const email = process.env.SEED_SUPER_ADMIN_EMAIL;
	const name = process.env.SEED_SUPER_ADMIN_NAME;

	if (!email || !name) {
		throw new Error("Defina SEED_SUPER_ADMIN_EMAIL e SEED_SUPER_ADMIN_NAME.");
	}

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
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (error) => {
		console.error(error);
		await prisma.$disconnect();
		process.exit(1);
	});
