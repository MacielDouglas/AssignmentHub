export type OrganizationAccessRole = "owner" | "admin" | "member";

export function getOrganizationAccessRole(member: {
	isOwner: boolean;
	isAdmin: boolean;
}): OrganizationAccessRole {
	if (member.isOwner) return "owner";
	if (member.isAdmin) return "admin";
	return "member";
}
