import "server-only";

export type CatalogScope = "GLOBAL" | "LOCAL";

export function resolveCatalogScope(params: {
	organizationId: string;
	isSuperAdmin: boolean;
	requestedScope: unknown;
}): { scope: CatalogScope; organizationId: string | null } {
	const scope: CatalogScope =
		params.requestedScope === "GLOBAL" ? "GLOBAL" : "LOCAL";

	if (scope === "GLOBAL" && !params.isSuperAdmin) {
		throw new Error(
			"Somente o superadministrador pode alterar o catálogo global.",
		);
	}

	return {
		scope,
		organizationId: scope === "GLOBAL" ? null : params.organizationId,
	};
}
