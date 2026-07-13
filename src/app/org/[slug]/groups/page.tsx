import { Crown, Shield, Users } from "lucide-react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { GroupFormDialog } from "@/features/groups/components/group-form-dialog";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type GroupsPageProps = {
	params: Promise<{
		slug: string;
	}>;
};

export default async function GroupsPage({ params }: GroupsPageProps) {
	const { slug } = await params;

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		notFound();
	}

	const membership = await db.organizationMembership.findFirst({
		where: {
			userId: session.user.id,
			organization: {
				slug,
			},
		},
		select: {
			role: true,
			organization: {
				select: {
					id: true,
					slug: true,
					name: true,
					groups: {
						orderBy: {
							name: "asc",
						},
						select: {
							id: true,
							name: true,
							slug: true,
							superintendentId: true,
							assistantId: true,
							superintendent: {
								select: {
									id: true,
									name: true,
								},
							},
							assistant: {
								select: {
									id: true,
									name: true,
								},
							},
							members: {
								orderBy: {
									name: "asc",
								},
								select: {
									id: true,
									name: true,
								},
							},
							_count: {
								select: {
									members: true,
								},
							},
						},
					},
					people: {
						orderBy: {
							name: "asc",
						},
						select: {
							id: true,
							name: true,
							sex: true,
							young: true,
							baptized: true,
							familyId: true,
							groupId: true,
							headedFamily: {
								select: {
									id: true,
									name: true,
								},
							},
							family: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
					_count: {
						select: {
							people: true,
							groups: true,
						},
					},
				},
			},
		},
	});

	if (!membership) {
		notFound();
	}

	const organization = membership.organization;

	const canManageGroups =
		membership.role === "OWNER" || membership.role === "ADMIN";

	const groupedPeopleCount = organization.people.filter(
		(person) => person.groupId !== null,
	).length;

	const availablePeopleCount = organization.people.filter(
		(person) => person.groupId === null,
	).length;

	return (
		<div className="space-y-6 p-6">
			<header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="space-y-2">
					<div className="flex flex-wrap items-center gap-2">
						<h1 className="text-2xl font-semibold tracking-tight">Grupos</h1>
						<span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
							{organization.name}
						</span>
					</div>

					<p className="max-w-2xl text-sm text-muted-foreground">
						Gerencie grupos da organização, defina superintendentes e ajudantes,
						mova membros e use a opção de levar a família junto quando fizer
						sentido.
					</p>
				</div>

				{canManageGroups ? (
					<GroupFormDialog
						mode="create"
						organizationSlug={organization.slug}
						organizationId={organization.id}
						people={organization.people}
						trigger={
							<span className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
								Novo grupo
							</span>
						}
					/>
				) : null}
			</header>

			<section className="grid gap-4 md:grid-cols-3">
				<div className="rounded-lg border p-4">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Users className="h-4 w-4" />
						Pessoas
					</div>
					<p className="mt-2 text-2xl font-semibold">
						{organization._count.people}
					</p>
					<p className="mt-1 text-xs text-muted-foreground">
						Total de pessoas da organização.
					</p>
				</div>

				<div className="rounded-lg border p-4">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Shield className="h-4 w-4" />
						Em grupo
					</div>
					<p className="mt-2 text-2xl font-semibold">{groupedPeopleCount}</p>
					<p className="mt-1 text-xs text-muted-foreground">
						Pessoas já vinculadas a algum grupo.
					</p>
				</div>

				<div className="rounded-lg border p-4">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Crown className="h-4 w-4" />
						Disponíveis
					</div>
					<p className="mt-2 text-2xl font-semibold">{availablePeopleCount}</p>
					<p className="mt-1 text-xs text-muted-foreground">
						Pessoas sem grupo no momento.
					</p>
				</div>
			</section>

			<section className="space-y-4">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h2 className="text-lg font-medium">Listagem de grupos</h2>
						<p className="text-sm text-muted-foreground">
							{organization._count.groups} grupo(s) cadastrado(s).
						</p>
					</div>
				</div>

				{organization.groups.length === 0 ? (
					<div className="rounded-lg border border-dashed p-8">
						<div className="mx-auto max-w-md space-y-2 text-center">
							<h3 className="font-medium">Nenhum grupo cadastrado</h3>
							<p className="text-sm text-muted-foreground">
								Crie o primeiro grupo para começar a organizar superintendentes,
								ajudantes e membros da organização.
							</p>
						</div>
					</div>
				) : (
					<div className="grid gap-4">
						{organization.groups.map((group) => (
							<article key={group.id} className="rounded-lg border p-4">
								<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
									<div className="min-w-0 space-y-3">
										<div className="space-y-1">
											<div className="flex flex-wrap items-center gap-2">
												<h3 className="text-base font-semibold">
													{group.name}
												</h3>
												<span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
													/{group.slug}
												</span>
											</div>

											<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
												<span className="rounded-full border px-2 py-1">
													{group._count.members} membro(s)
												</span>
												<span className="rounded-full border px-2 py-1">
													Superintendente: {group.superintendent.name}
												</span>
												<span className="rounded-full border px-2 py-1">
													Ajudante: {group.assistant.name}
												</span>
											</div>
										</div>

										<div className="space-y-2">
											<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
												Membros
											</p>

											{group.members.length === 0 ? (
												<p className="text-sm text-muted-foreground">
													Nenhum membro vinculado.
												</p>
											) : (
												<div className="flex flex-wrap gap-2">
													{group.members.map((member) => (
														<span
															key={member.id}
															className="rounded-full border px-2 py-1 text-sm"
														>
															{member.name}
														</span>
													))}
												</div>
											)}
										</div>
									</div>

									{canManageGroups ? (
										<div className="shrink-0">
											<GroupFormDialog
												mode="edit"
												organizationSlug={organization.slug}
												organizationId={organization.id}
												people={organization.people}
												group={{
													id: group.id,
													name: group.name,
													slug: group.slug,
													superintendentId: group.superintendentId,
													assistantId: group.assistantId,
													members: group.members,
												}}
												trigger={
													<span className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium">
														Editar grupo
													</span>
												}
											/>
										</div>
									) : null}
								</div>
							</article>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
