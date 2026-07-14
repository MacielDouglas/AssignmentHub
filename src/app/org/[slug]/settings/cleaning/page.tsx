import { ArrowLeft, ShieldAlert, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type OrganizationCleaningSettingsPageProps = {
	params: Promise<{
		slug: string;
	}>;
};

async function getCleaningSettingsData(slug: string, userId: string) {
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
					cleaningSettings: {
						select: {
							id: true,
							cleaningPerMeeting: true,
							weeklyCleaning: true,
							generalCleaning: true,
							configs: {
								orderBy: {
									type: "asc",
								},
								select: {
									id: true,
									type: true,
									enabled: true,
									assignmentMode: true,
									notes: true,
									timesPerWeek: true,
									timesPerYear: true,
									intervalDays: true,
									weekdays: {
										orderBy: {
											sortOrder: "asc",
										},
										select: {
											id: true,
											weekday: true,
											sortOrder: true,
										},
									},
									sectors: {
										orderBy: {
											sortOrder: "asc",
										},
										select: {
											id: true,
											name: true,
											description: true,
											peopleRequired: true,
											sortOrder: true,
										},
									},
								},
							},
						},
					},
				},
			},
		},
	});
}

export async function generateMetadata({
	params,
}: OrganizationCleaningSettingsPageProps): Promise<Metadata> {
	const { slug } = await params;

	return {
		title: `${slug} | Configurações de limpeza`,
	};
}

function getTypeLabel(type: string) {
	switch (type) {
		case "MEETING":
			return "Limpeza por reunião";
		case "WEEKLY":
			return "Limpeza semanal";
		case "GENERAL":
			return "Limpeza geral";
		default:
			return type;
	}
}

function getAssignmentModeLabel(mode: string | null) {
	switch (mode) {
		case "GROUP":
			return "Grupo";
		case "FAMILY":
			return "Família";
		case "PERSON":
			return "Pessoa";
		default:
			return "Não definido";
	}
}

export default async function OrganizationCleaningSettingsPage({
	params,
}: OrganizationCleaningSettingsPageProps) {
	const { slug } = await params;

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		notFound();
	}

	const membership = await getCleaningSettingsData(slug, session.user.id);

	if (!membership) {
		notFound();
	}

	const canManageOrganization =
		membership.role === "OWNER" || membership.role === "ADMIN";

	const cleaningSettings = membership.organization.cleaningSettings;

	return (
		<div className="space-y-6">
			<section className="flex items-center justify-between gap-4">
				<div className="space-y-2">
					<Link
						href={`/org/${membership.organization.slug}/settings`}
						className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
					>
						<ArrowLeft className="h-4 w-4" />
						Voltar para configurações
					</Link>

					<div className="flex items-start gap-3">
						<div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-muted">
							<Sparkles className="h-5 w-5" />
						</div>

						<div>
							<h1 className="text-2xl font-semibold">
								Configurações de limpeza
							</h1>
							<p className="text-sm text-muted-foreground">
								Defina os tipos de limpeza, frequência, modo de designação e
								setores da organização.
							</p>
						</div>
					</div>
				</div>
			</section>

			{!canManageOrganization ? (
				<section className="rounded-lg border p-6">
					<div className="flex items-start gap-3">
						<ShieldAlert className="mt-0.5 h-5 w-5 text-muted-foreground" />
						<div>
							<h2 className="font-medium">Acesso somente leitura</h2>
							<p className="mt-1 text-sm text-muted-foreground">
								Você pode visualizar as configurações de limpeza, mas não pode
								alterá-las.
							</p>
						</div>
					</div>
				</section>
			) : null}

			<section className="grid gap-4 md:grid-cols-3">
				<div className="rounded-lg border p-5">
					<h2 className="text-sm font-medium text-muted-foreground">
						Por reunião
					</h2>
					<p className="mt-2 text-lg font-semibold">
						{cleaningSettings?.cleaningPerMeeting ? "Ativo" : "Inativo"}
					</p>
				</div>

				<div className="rounded-lg border p-5">
					<h2 className="text-sm font-medium text-muted-foreground">Semanal</h2>
					<p className="mt-2 text-lg font-semibold">
						{cleaningSettings?.weeklyCleaning ? "Ativo" : "Inativo"}
					</p>
				</div>

				<div className="rounded-lg border p-5">
					<h2 className="text-sm font-medium text-muted-foreground">Geral</h2>
					<p className="mt-2 text-lg font-semibold">
						{cleaningSettings?.generalCleaning ? "Ativo" : "Inativo"}
					</p>
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="text-base font-medium">Configurações por tipo</h2>

				{cleaningSettings?.configs.length ? (
					<div className="grid gap-4">
						{cleaningSettings.configs.map((config) => (
							<article key={config.id} className="rounded-lg border p-5">
								<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
									<div className="space-y-2">
										<h3 className="font-semibold">
											{getTypeLabel(config.type)}
										</h3>
										<p className="text-sm text-muted-foreground">
											Modo de designação:{" "}
											{getAssignmentModeLabel(config.assignmentMode)}
										</p>
										<p className="text-sm text-muted-foreground">
											Status: {config.enabled ? "Ativo" : "Inativo"}
										</p>
										{config.notes ? (
											<p className="text-sm text-muted-foreground">
												{config.notes}
											</p>
										) : null}
									</div>

									<div className="text-sm text-muted-foreground">
										{config.timesPerWeek ? (
											<p>{config.timesPerWeek}x por semana</p>
										) : null}
										{config.timesPerYear ? (
											<p>{config.timesPerYear}x por ano</p>
										) : null}
										{config.intervalDays ? (
											<p>A cada {config.intervalDays} dias</p>
										) : null}
									</div>
								</div>

								{config.weekdays.length > 0 ? (
									<div className="mt-4">
										<h4 className="text-sm font-medium">Dias</h4>
										<p className="mt-1 text-sm text-muted-foreground">
											{config.weekdays.map((item) => item.weekday).join(", ")}
										</p>
									</div>
								) : null}

								{config.sectors.length > 0 ? (
									<div className="mt-4">
										<h4 className="text-sm font-medium">Setores</h4>
										<ul className="mt-2 space-y-2 text-sm text-muted-foreground">
											{config.sectors.map((sector) => (
												<li key={sector.id}>
													{sector.name}
													{sector.peopleRequired
														? ` · ${sector.peopleRequired} pessoa(s)`
														: ""}
												</li>
											))}
										</ul>
									</div>
								) : null}
							</article>
						))}
					</div>
				) : (
					<div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
						Nenhuma configuração de limpeza encontrada para esta organização.
					</div>
				)}
			</section>
		</div>
	);
}
