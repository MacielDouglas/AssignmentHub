import { db } from "@/lib/db";

export async function getPendingUsers() {
	const users = await db.user.findMany({
		where: {
			memberships: {
				none: {},
			},
		},
		select: {
			id: true,
			email: true,
			name: true,
			systemRole: true,
		},
		orderBy: {
			email: "asc",
		},
	});

	return users;
}
