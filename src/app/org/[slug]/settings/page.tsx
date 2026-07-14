import { Settings2, Shield, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
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
					cleaningSettings: {
						select: {
							id: true,
							cleaningPerMeeting: true,
							weeklyCleaning: true,
							generalCleaning: true,
						},
					},
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

	const cleaningSettings = membership.organization.cleaningSettings;

	const cleaningSummary = cleaningSettings
		? [
				cleaningSettings.cleaningPerMeeting ? "por reunião" : null,
				cleaningSettings.weeklyCleaning ? "semanal" : null,
				cleaningSettings.generalCleaning ? "geral" : null,
			]
				.filter(Boolean)
				.join(", ")
		: "Nenhuma configuração criada";

	return (
		<div className="space-y-6">
			<section className="rounded-lg border p-6">
				<div className="flex items-start gap-3">
					<div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-muted">
						<Settings2 className="h-5 w-5" />
					</div>

					<div className="space-y-2">
						<h2 className="text-xl font-semibold">
							Configurações da organização
						</h2>
						<p className="max-w-2xl text-sm text-muted-foreground">
							Gerencie os módulos e preferências da organização. Comece pelas
							configurações de limpeza e evolua depois para permissões e outros
							recursos.
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

			<section className="space-y-3">
				<h3 className="text-base font-medium">Módulos</h3>

				<div className="grid gap-4 md:grid-cols-2">
					<Link
						href={`/org/${membership.organization.slug}/settings/cleaning`}
						className="rounded-lg border p-5 transition-colors hover:bg-muted/40"
					>
						<div className="flex items-start gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted">
								<Sparkles className="h-4 w-4" />
							</div>

							<div className="min-w-0 flex-1">
								<div className="flex items-center justify-between gap-3">
									<h4 className="font-medium">Limpeza</h4>
									<span className="text-xs text-muted-foreground">
										{cleaningSettings ? "Configurado" : "Pendente"}
									</span>
								</div>

								<p className="mt-2 text-sm text-muted-foreground">
									Configure limpeza por reunião, semanal e geral.
								</p>

								<p className="mt-3 text-xs text-muted-foreground">
									{cleaningSummary}
								</p>
							</div>
						</div>
					</Link>
				</div>
			</section>

			<section className="rounded-lg border border-dashed p-6">
				<h3 className="text-base font-medium">Próximos módulos</h3>
				<ul className="mt-3 space-y-2 text-sm text-muted-foreground">
					<li>Editar nome e slug da organização.</li>
					<li>Gerenciar membros administrativos.</li>
					<li>Ativar ou desativar módulos da organização.</li>
				</ul>
			</section>
		</div>
	);
}
