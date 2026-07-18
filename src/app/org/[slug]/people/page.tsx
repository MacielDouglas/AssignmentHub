import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
	HiOutlineHeart,
	HiOutlineShieldCheck,
	HiOutlineSparkles,
	HiOutlineUser,
	HiOutlineUsers,
} from "react-icons/hi2";

import { PersonActionsMenu } from "@/features/people/components/person-actions-menu";
import { PersonFormDialog } from "@/features/people/components/person-form-dialog";
import {
	buildRenderedPeople,
	type PersonListItem,
} from "@/features/people/lib/people-view";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type PeoplePageProps = {
	params: Promise<{ slug: string }>;
};

function Badge({
	label,
	tone = "neutral",
}: {
	label: string;
	tone?: "neutral" | "blue" | "violet" | "emerald";
}) {
	const tones = {
		neutral:
			"border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200",
		blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
		violet:
			"border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300",
		emerald:
			"border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
	};

	return (
		<span
			className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${tones[tone]}`}
		>
			{label}
		</span>
	);
}

export default async function PeoplePage({ params }: PeoplePageProps) {
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
					families: {
						orderBy: { name: "asc" },
						select: {
							id: true,
							name: true,
							headId: true,
							members: {
								select: {
									id: true,
									name: true,
								},
								orderBy: { name: "asc" },
							},
						},
					},
					people: {
						orderBy: { name: "asc" },
						select: {
							id: true,
							name: true,
							sex: true,
							isActive: true,
							isStudent: true,
							isMarried: true,
							spouseId: true,
							familyId: true,
							spouse: {
								select: {
									id: true,
									name: true,
									sex: true,
								},
							},
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
							baptized: true,
							young: true,
							initiatingConversations: true,
							cultivatingInterest: true,
							makingDisciples: true,
							explainingBeliefs: true,
							cleaning: true,
							bibleReading: true,
							roamingMic: true,
							sound: true,
							video: true,
							stage: true,
							bibleStudyReader: true,
							watchtowerReader: true,
							attendant: true,
							privilegePrayer: true,
							user: {
								select: { id: true },
							},
							servicePrivilege: {
								select: {
									elder: true,
									publicTalk: true,
									spiritualGems: true,
									treasuresFromGodsWordTalk: true,
									lifeAndMinistryChairman: true,
									weekendChairman: true,
									ourChristianLifeAssignment: true,
									localNeeds: true,
									bibleStudyConductor: true,
									watchtowerConductor: true,
								},
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

	const canManagePeople =
		membership.role === "OWNER" || membership.role === "ADMIN";

	const organization = membership.organization;

	const families = organization.families.map((family) => ({
		id: family.id,
		name: family.name,
	}));

	const peopleOptions = organization.people.map((person) => ({
		id: person.id,
		name: person.name,
		sex: person.sex,
		familyId: person.familyId,
	}));

	const renderedPeople = buildRenderedPeople(
		organization.people as PersonListItem[],
	);

	const totalPeople = organization.people.length;
	const activePeople = organization.people.filter(
		(person) => person.isActive,
	).length;
	const familyHeads = organization.people.filter(
		(person) => person.headedFamily,
	).length;

	const malePeople = organization.people.filter(
		(person) => person.sex === "MALE",
	).length;
	const femalePeople = organization.people.filter(
		(person) => person.sex === "FEMALE",
	).length;
	const servicePeople = organization.people.filter(
		(person) => person.servicePrivilege?.spiritualGems,
	).length;

	return (
		<main className="space-y-6">
			<section className="overflow-hidden rounded-[32px] border border-slate-200 bg-linear-to-br from-blue-600 via-blue-600 to-violet-600 text-white shadow-xl shadow-blue-600/20 dark:border-slate-800">
				<div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
					<header className="space-y-3">
						<div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/90 backdrop-blur">
							<HiOutlineSparkles className="h-4 w-4" />
							Gestão de pessoas
						</div>
						<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
							Pessoas e designações.
						</h1>
						<p className="max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
							Cadastre pessoas, organize famílias, controle privilégios e
							designações.
						</p>
					</header>

					<div className="grid grid-cols-3 gap-3">
						<article className="rounded-[24px] bg-white/10 p-4 backdrop-blur">
							<p className="text-xs text-white/70">Pessoas</p>
							<p className="mt-2 text-2xl font-semibold">{totalPeople}</p>
						</article>
						<article className="rounded-[24px] bg-white/10 p-4 backdrop-blur">
							<p className="text-xs text-white/70">Ativas</p>
							<p className="mt-2 text-2xl font-semibold">{activePeople}</p>
						</article>
						<article className="rounded-[24px] bg-white/10 p-4 backdrop-blur">
							<p className="text-xs text-white/70">Famílias</p>
							<p className="mt-2 text-2xl font-semibold">{familyHeads}</p>
						</article>
						<article className="rounded-[24px] bg-white/10 p-4 backdrop-blur">
							<p className="text-xs text-white/70">Homens</p>
							<p className="mt-2 text-2xl font-semibold">{malePeople}</p>
						</article>
						<article className="rounded-[24px] bg-white/10 p-4 backdrop-blur">
							<p className="text-xs text-white/70">Mulheres</p>
							<p className="mt-2 text-2xl font-semibold">{femalePeople}</p>
						</article>
						<article className="rounded-[24px] bg-white/10 p-4 backdrop-blur">
							<p className="text-xs text-white/70">Privilégios de Serviço</p>
							<p className="mt-2 text-2xl font-semibold">{servicePeople}</p>
						</article>
					</div>
				</div>
			</section>

			<section className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<header className="space-y-1">
						<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
							Cadastro de pessoas
						</h2>
						<p className="text-sm text-slate-500 dark:text-slate-400">
							Interface mobile first, semântica melhor e ações seguras.
						</p>
					</header>

					{canManagePeople ? (
						<PersonFormDialog
							slug={organization.slug}
							mode="create"
							families={families}
							peopleOptions={peopleOptions}
						/>
					) : null}
				</div>

				{renderedPeople.length === 0 ? (
					<article className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
						<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
							<HiOutlineUsers className="h-6 w-6" />
						</div>
						<h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
							Nenhuma pessoa cadastrada
						</h3>
						<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
							Comece adicionando a primeira pessoa da organização.
						</p>
					</article>
				) : (
					<div className="grid gap-4">
						{renderedPeople.map(({ person, groupLabel, isHead }) => {
							const familyMembers =
								person.familyId || person.headedFamily?.id
									? (organization.families.find(
											(family) =>
												family.id ===
												(person.headedFamily?.id ?? person.familyId),
										)?.members ?? [])
									: [];

							return (
								<article
									key={person.id}
									className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-4 shadow-sm transition hover:border-blue-200 hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-blue-900 dark:hover:bg-slate-950 sm:p-5"
								>
									<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
										<div className="space-y-4">
											<header className="space-y-3">
												<div className="flex flex-wrap items-center gap-2">
													<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/20">
														<HiOutlineUser className="h-5 w-5" />
													</div>

													<div className="min-w-0">
														<h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-50">
															{person.name}
														</h3>
														<p className="text-xs text-slate-500 dark:text-slate-400">
															{person.sex === "MALE" ? "Masculino" : "Feminino"}
														</p>
													</div>
												</div>

												<div className="flex flex-wrap gap-2">
													<Badge
														label={person.isActive ? "Ativo" : "Inativo"}
														tone={person.isActive ? "emerald" : "neutral"}
													/>
													<Badge label={person.young ? "Jovem" : "Adulto"} />
													{person.isStudent ? (
														<Badge label="Estudante" />
													) : null}
													{person.baptized ? (
														<Badge label="Batizado(a)" tone="blue" />
													) : null}
													{person.isMarried ? (
														<Badge
															label={
																person.spouse
																	? `Casado(a) com ${person.spouse.name}`
																	: "Casado(a)"
															}
															tone="violet"
														/>
													) : null}
													{groupLabel ? (
														<Badge
															label={
																isHead
																	? `Chefe · ${groupLabel}`
																	: `Família · ${groupLabel}`
															}
															tone="blue"
														/>
													) : null}
													{person.user ? (
														<Badge label="Com usuário vinculado" />
													) : null}
												</div>
											</header>

											<div className="flex flex-wrap gap-2">
												{person.servicePrivilege?.elder ? (
													<Badge label="Ancião" tone="violet" />
												) : null}
												{person.servicePrivilege?.spiritualGems ? (
													<Badge label="Jóias espirituais" tone="violet" />
												) : null}

												{person.servicePrivilege?.treasuresFromGodsWordTalk ? (
													<Badge
														label="Discurso Tesouros da Palavra de Deus"
														tone="violet"
													/>
												) : null}
												{person.servicePrivilege?.publicTalk ? (
													<Badge label="Discurso público" tone="violet" />
												) : null}
												{person.bibleReading ? (
													<Badge label="Leitura da Bíblia" />
												) : null}
												{person.sound ? <Badge label="Som" /> : null}
												{person.video ? <Badge label="Vídeo" /> : null}
												{person.cleaning ? <Badge label="Limpeza" /> : null}
												{person.privilegePrayer ? (
													<Badge label="Oração" />
												) : null}
											</div>
										</div>

										<div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-56">
											<PersonActionsMenu
												slug={organization.slug}
												canManage={canManagePeople}
												person={{
													id: person.id,
													name: person.name,
													headedFamily: person.headedFamily,
													user: person.user,
												}}
												familyMembers={familyMembers}
												editTrigger={
													<PersonFormDialog
														slug={organization.slug}
														mode="edit"
														families={families}
														peopleOptions={peopleOptions}
														person={person}
														trigger={
															<button
																type="button"
																className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
															>
																Editar
															</button>
														}
													/>
												}
											/>
										</div>
									</div>
								</article>
							);
						})}
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
						Layout estruturado com main, section, article e header para leitura
						e manutenção melhores.
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
						Todas as ações sensíveis passam por sessão, Zod, checagem de
						organização e transação Prisma.
					</p>
				</article>

				<article className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
					<div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
						<HiOutlineHeart className="h-5 w-5" />
					</div>
					<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
						Regras familiares
					</h3>
					<p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
						Casamento exige família válida, duas pessoas adultas e de sexos
						diferentes na mesma família, com vínculo calculado automaticamente.
					</p>
				</article>
			</section>
		</main>
	);
}
