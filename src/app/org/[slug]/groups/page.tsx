import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { HiOutlineUserGroup } from "react-icons/hi2";

import { StatusBadge } from "@/components/ui/status-badge";
import { GroupActionsMenu } from "@/features/groups/components/group-actions-menu";
import { GroupFormDialog } from "@/features/groups/components/group-form-dialog";
import type { GroupSelectablePerson } from "@/features/groups/lib/groups-view";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type GroupsPageProps = {
	params: Promise<{ slug: string }>;
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
			organization: { slug },
		},
		select: {
			role: true,
			organization: {
				select: {
					id: true,
					slug: true,
					name: true,
					groups: {
						orderBy: { name: "asc" },
						select: {
							id: true,
							name: true,
							slug: true,
							superintendentId: true,
							assistantId: true,
							superintendent: {
								select: { id: true, name: true },
							},
							assistant: {
								select: { id: true, name: true },
							},
							members: {
								orderBy: { name: "asc" },
								select: { id: true, name: true },
							},
						},
					},
					people: {
						orderBy: { name: "asc" },
						select: {
							id: true,
							name: true,
							sex: true,
							young: true,
							baptized: true,
							familyId: true,
							groupId: true,
							headedFamily: {
								select: { id: true, name: true },
							},
							family: {
								select: { id: true, name: true },
							},
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

	const people = organization.people as GroupSelectablePerson[];
	const totalPeople = people.length;
	const totalGroups = organization.groups.length;
	const groupedPeopleCount = people.filter((p) => p.groupId !== null).length;
	const availablePeopleCount = people.filter((p) => p.groupId === null).length;

	return (
		<main className="space-y-6">
			<section className="rounded-4xl border border-border bg-muted p-5 sm:p-6 lg:p-8">
				<div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
					<header className="space-y-3">
						<h1 className="text-display text-foreground sm:text-3xl">
							Grupos e liderança.
						</h1>
						<p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
							Organize superintendentes, ajudantes e membros. Mova famílias com
							segurança e evite conflitos entre grupos.
						</p>
					</header>

					<div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
						<article className="rounded-3xl border border-border bg-card p-4">
							<p className="text-xs text-muted-foreground">Grupos</p>
							<p className="mt-2 text-display text-foreground">{totalGroups}</p>
						</article>
						<article className="rounded-3xl border border-border bg-card p-4">
							<p className="text-xs text-muted-foreground">Pessoas</p>
							<p className="mt-2 text-display text-foreground">{totalPeople}</p>
						</article>
						<article className="rounded-3xl border border-border bg-card p-4">
							<p className="text-xs text-muted-foreground">Em grupo</p>
							<p className="mt-2 text-display text-foreground">
								{groupedPeopleCount}
							</p>
						</article>
						<article className="rounded-3xl border border-border bg-card p-4">
							<p className="text-xs text-muted-foreground">Disponíveis</p>
							<p className="mt-2 text-display text-foreground">
								{availablePeopleCount}
							</p>
						</article>
					</div>
				</div>
			</section>

			<section className="flex flex-col gap-4 rounded-4xl border border-border bg-card p-4 shadow-md ring-1 ring-border/30 sm:p-5">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<header className="space-y-1">
						<h2 className="text-headline text-foreground">
							Cadastro de grupos
						</h2>
					</header>

					{canManageGroups ? (
						<GroupFormDialog
							mode="create"
							organizationSlug={organization.slug}
							people={people}
						/>
					) : null}
				</div>

				{organization.groups.length === 0 ? (
					<article className="rounded-4xl border border-dashed border-border bg-muted/50 p-8 text-center">
						<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
							<HiOutlineUserGroup className="h-6 w-6" />
						</div>
						<h3 className="text-title text-foreground">
							Nenhum grupo cadastrado
						</h3>
						<p className="mt-2 text-sm text-muted-foreground">
							Crie o primeiro grupo para organizar superintendentes, ajudantes e
							membros.
						</p>
					</article>
				) : (
					<div className="grid gap-4">
						{organization.groups.map((group) => (
							<article
								key={group.id}
								className="rounded-4xl border border-border bg-muted/50 p-4 shadow-sm transition hover:bg-card sm:p-5"
							>
								<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
									<div className="min-w-0 space-y-4">
										<header className="space-y-3">
											<div className="flex flex-wrap items-center gap-2">
												<div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
													<HiOutlineUserGroup className="h-5 w-5" />
												</div>
												<div className="min-w-0">
													<h3 className="truncate text-title text-foreground">
														{group.name}
													</h3>
													<p className="text-xs text-muted-foreground">
														/{group.slug}
													</p>
												</div>
											</div>

											<div className="flex flex-wrap gap-2">
												<StatusBadge
													label={`${group.members.length} membro(s)`}
												/>
												<StatusBadge
													label={`Superintendente · ${group.superintendent.name}`}
												/>
												<StatusBadge
													label={`Ajudante · ${group.assistant.name}`}
												/>
											</div>
										</header>

										<div className="space-y-2">
											<p className="text-label uppercase text-muted-foreground">
												Membros
											</p>
											{group.members.length === 0 ? (
												<p className="text-sm text-muted-foreground">
													Nenhum membro vinculado.
												</p>
											) : (
												<div className="flex flex-wrap gap-2">
													{group.members.map((member) => (
														<StatusBadge key={member.id} label={member.name} />
													))}
												</div>
											)}
										</div>
									</div>

									<GroupActionsMenu
										canManage={canManageGroups}
										organizationSlug={organization.slug}
										group={{
											id: group.id,
											name: group.name,
											slug: group.slug,
											superintendentId: group.superintendentId,
											assistantId: group.assistantId,
											members: group.members,
										}}
										people={people}
										editTrigger={
											<GroupFormDialog
												mode="edit"
												organizationSlug={organization.slug}
												people={people}
												group={{
													id: group.id,
													name: group.name,
													slug: group.slug,
													superintendentId: group.superintendentId,
													assistantId: group.assistantId,
													members: group.members,
												}}
												trigger={
													<button
														type="button"
														className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-4xl border border-border bg-card px-4 text-sm font-medium text-foreground lg:w-auto"
													>
														Editar
													</button>
												}
											/>
										}
									/>
								</div>
							</article>
						))}
					</div>
				)}
			</section>
		</main>
	);
}
