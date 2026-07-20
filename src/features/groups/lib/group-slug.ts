export function generateGroupSlug(name: string) {
	return name
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}
