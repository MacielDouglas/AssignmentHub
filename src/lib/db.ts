import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
	prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
	const connectionString = `${process.env.DATABASE_URL}`;
	const adapter = new PrismaPg({ connectionString });
	return new PrismaClient({ adapter });
}

// Singleton via globalThis: evita esgotar o pool Neon em dev/HMR e
// reaproveita conexões em Fluid Compute (menor latência + custo).
const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = db;
}

export { db };
