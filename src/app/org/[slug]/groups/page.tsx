import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
	HiOutlineHeart,
	HiOutlineShieldCheck,
	HiOutlineSparkles,
	HiOutlineUserGroup,
	HiOutlineUsers,
} from "react-icons/hi2";

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
			<section className="overflow-hidden rounded-[32px] border border-slate-200 bg-linear-to-br from-blue-600 via-blue-600 to-violet-600 text-white shadow-xl shadow-blue-600/20 dark:border-slate-800">
				<div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
					<header className="space-y-3">
						<div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/90 backdrop-blur">
							<HiOutlineSparkles className="h-4 w-4" />
							Gestão de grupos
						</div>
						<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
							Grupos e liderança.
						</h1>
						<p className="max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
							Organize superintendentes, ajudantes e membros. Mova famílias com
							segurança e evite conflitos entre grupos.
						</p>
					</header>

					<div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
						<article className="rounded-[24px] bg-white/10 p-4 backdrop-blur">
							<p className="text-xs text-white/70">Grupos</p>
							<p className="mt-2 text-2xl font-semibold">{totalGroups}</p>
						</article>
						<article className="rounded-[24px] bg-white/10 p-4 backdrop-blur">
							<p className="text-xs text-white/70">Pessoas</p>
							<p className="mt-2 text-2xl font-semibold">{totalPeople}</p>
						</article>
						<article className="rounded-[24px] bg-white/10 p-4 backdrop-blur">
							<p className="text-xs text-white/70">Em grupo</p>
							<p className="mt-2 text-2xl font-semibold">
								{groupedPeopleCount}
							</p>
						</article>
						<article className="rounded-[24px] bg-white/10 p-4 backdrop-blur">
							<p className="text-xs text-white/70">Disponíveis</p>
							<p className="mt-2 text-2xl font-semibold">
								{availablePeopleCount}
							</p>
						</article>
					</div>
				</div>
			</section>

			<section className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<header className="space-y-1">
						<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
							Cadastro de grupos
						</h2>
						<p className="text-sm text-slate-500 dark:text-slate-400">
							Interface mobile first, conflitos explícitos e exclusão protegida.
						</p>
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
					<article className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
						<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
							<HiOutlineUserGroup className="h-6 w-6" />
						</div>
						<h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
							Nenhum grupo cadastrado
						</h3>
						<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
							Crie o primeiro grupo para organizar superintendentes, ajudantes e
							membros.
						</p>
					</article>
				) : (
					<div className="grid gap-4">
						{organization.groups.map((group) => (
							<article
								key={group.id}
								className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-4 shadow-sm transition hover:border-blue-200 hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-blue-900 dark:hover:bg-slate-950 sm:p-5"
							>
								<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
									<div className="min-w-0 space-y-4">
										<header className="space-y-3">
											<div className="flex flex-wrap items-center gap-2">
												<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/20">
													<HiOutlineUserGroup className="h-5 w-5" />
												</div>
												<div className="min-w-0">
													<h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-50">
														{group.name}
													</h3>
													<p className="text-xs text-slate-500 dark:text-slate-400">
														/{group.slug}
													</p>
												</div>
											</div>

											<div className="flex flex-wrap gap-2">
												<StatusBadge
													label={`${group.members.length} membro(s)`}
													tone="blue"
												/>
												<StatusBadge
													label={`Superintendente · ${group.superintendent.name}`}
													tone="violet"
												/>
												<StatusBadge
													label={`Ajudante · ${group.assistant.name}`}
													tone="violet"
												/>
											</div>
										</header>

										<div className="space-y-2">
											<p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
												Membros
											</p>
											{group.members.length === 0 ? (
												<p className="text-sm text-slate-500 dark:text-slate-400">
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
														className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 lg:w-auto"
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

			<section className="grid gap-4 md:grid-cols-3">
				<article className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
					<div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
						<HiOutlineUsers className="h-5 w-5" />
					</div>
					<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
						Semântica
					</h3>
					<p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
						Layout com main, section, article e header, alinhado à página de
						pessoas para leitura e manutenção consistentes.
					</p>
				</article>

				<article className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
					<div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
						<HiOutlineShieldCheck className="h-5 w-5" />
					</div>
					<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
						Segurança
					</h3>
					<p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
						Sessão, papel OWNER/ADMIN, Zod com UUID, organização resolvida só
						pelo slug no server e exclusão bloqueada com dependências listadas.
					</p>
				</article>

				<article className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
					<div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
						<HiOutlineHeart className="h-5 w-5" />
					</div>
					<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
						Regras de grupo
					</h3>
					<p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
						Superintendente e ajudante distintos, homens adultos batizados.
						Transferência entre grupos exige confirmação e opção de mover a
						família inteira.
					</p>
				</article>
			</section>
		</main>
	);
}
