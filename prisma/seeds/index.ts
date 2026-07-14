import { seedCleaningSettings } from "./cleaning.seed";
import { seedSuperAdmin } from "./super-admin.seed";
import { prisma } from "./utils";

export async function runSeeds() {
	try {
		await seedSuperAdmin();
		await seedCleaningSettings();
	} catch (error) {
		console.error(error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}
