import { Building2, Shield } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type OrganizationSettingsPageProps = {
	params: Promise<{
		slug: string;
	}>;
};

async function getOrganizationSettingsData(slug: string, userId: string) {
	return db.organizationMembership.findFirst({
		where: {
			userId,
			organization: {
				slug,
			},
		},
		select: {
			role: true,
			organization: {
				select: {
					id: true,
					name: true,
					slug: true,
					createdAt: true,
					updatedAt: true,
				},
			},
		},
	});
}

export async function generateMetadata({
	params,
}: OrganizationSettingsPageProps): Promise<Metadata> {
	const { slug } = await params;

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return {
			title: "Configurações",
		};
	}

	const membership = await getOrganizationSettingsData(slug, session.user.id);

	if (!membership) {
		return {
			title: "Configurações",
		};
	}

	return {
		title: `${membership.organization.name} | Configurações`,
		description: `Configurações da organização ${membership.organization.name}.`,
	};
}

export default async function OrganizationSettingsPage({
	params,
}: OrganizationSettingsPageProps) {
	const { slug } = await params;

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		notFound();
	}

	const membership = await getOrganizationSettingsData(slug, session.user.id);

	if (!membership) {
		notFound();
	}

	const canManageOrganization =
		membership.role === "OWNER" || membership.role === "ADMIN";

	return (
		<div className="space-y-6">
			<section className="rounded-lg border p-6">
				<div className="flex items-start gap-3">
					<div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-muted">
						<Building2 className="h-5 w-5" />
					</div>

					<div className="space-y-2">
						<h2 className="text-xl font-semibold">Configurações</h2>
						<p className="max-w-2xl text-sm text-muted-foreground">
							Esta é uma página inicial de configurações para manter a navegação
							consistente enquanto você evolui os formulários e ações da
							organização.
						</p>
					</div>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-2">
				<div className="rounded-lg border p-5">
					<h3 className="text-sm font-medium text-muted-foreground">
						Nome da organização
					</h3>
					<p className="mt-2 text-lg font-semibold">
						{membership.organization.name}
					</p>
				</div>

				<div className="rounded-lg border p-5">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Shield className="h-4 w-4" />
						Permissão atual
					</div>
					<p className="mt-2 text-lg font-semibold">{membership.role}</p>
					<p className="mt-1 text-xs text-muted-foreground">
						{canManageOrganization
							? "Você pode gerenciar esta organização."
							: "Você possui acesso de consulta."}
					</p>
				</div>
			</section>

			<section className="rounded-lg border border-dashed p-6">
				<h3 className="text-base font-medium">Próximos ajustes sugeridos</h3>
				<ul className="mt-3 space-y-2 text-sm text-muted-foreground">
					<li>Editar nome e slug da organização.</li>
					<li>Gerenciar membros administrativos.</li>
					<li>Configurar preferências e módulos ativos.</li>
				</ul>
			</section>
		</div>
	);
}
