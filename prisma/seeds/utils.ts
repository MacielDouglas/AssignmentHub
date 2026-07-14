import { db } from "@/lib/db";

export const prisma = db;

export function logSeedStep(message: string) {
	console.log(`[seed] ${message}`);
}
