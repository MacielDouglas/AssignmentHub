import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { HiOutlineUser } from "react-icons/hi2";

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
			<section className="rounded-4xl border border-border bg-muted p-5 sm:p-6 lg:p-8">
				<div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
					<header className="space-y-3">
						<h1 className="text-display text-foreground sm:text-3xl">
							Pessoas e designações.
						</h1>
						<p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
							Cadastre pessoas, organize famílias, controle privilégios e
							designações.
						</p>
					</header>

					<div className="grid grid-cols-3 gap-3">
						<article className="rounded-3xl border border-border bg-card p-4">
							<p className="text-label text-muted-foreground">Pessoas</p>
							<p className="mt-2 text-display text-foreground">{totalPeople}</p>
						</article>
						<article className="rounded-3xl border border-border bg-card p-4">
							<p className="text-label text-muted-foreground">Ativas</p>
							<p className="mt-2 text-display text-foreground">
								{activePeople}
							</p>
						</article>
						<article className="rounded-3xl border border-border bg-card p-4">
							<p className="text-label text-muted-foreground">Famílias</p>
							<p className="mt-2 text-display text-foreground">{familyHeads}</p>
						</article>
						<article className="rounded-3xl border border-border bg-card p-4">
							<p className="text-label text-muted-foreground">Homens</p>
							<p className="mt-2 text-display text-foreground">{malePeople}</p>
						</article>
						<article className="rounded-3xl border border-border bg-card p-4">
							<p className="text-label text-muted-foreground">Mulheres</p>
							<p className="mt-2 text-display text-foreground">
								{femalePeople}
							</p>
						</article>
						<article className="rounded-3xl border border-border bg-card p-4">
							<p className="text-label text-muted-foreground">
								Privilégios de Serviço
							</p>
							<p className="mt-2 text-display text-foreground">
								{servicePeople}
							</p>
						</article>
					</div>
				</div>
			</section>

			<section className="flex flex-col gap-4 rounded-4xl border border-border bg-card p-4 shadow-md ring-1 ring-border/30 sm:p-5">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<header className="space-y-1">
						<h2 className="text-headline text-foreground">
							Cadastro de pessoas
						</h2>
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
					<article className="rounded-4xl border border-dashed border-border bg-muted/50 p-8 text-center">
						<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								className="h-6 w-6"
								stroke="currentColor"
								strokeWidth={1.8}
								aria-hidden="true"
							>
								<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
								<circle cx="9" cy="7" r="4" />
							</svg>
						</div>
						<h3 className="text-title text-foreground">
							Nenhuma pessoa cadastrada
						</h3>
						<p className="mt-2 text-sm text-muted-foreground">
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
									className="rounded-4xl border border-border bg-muted/50 p-4 shadow-sm transition hover:bg-card sm:p-5"
								>
									<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
										<div className="space-y-4">
											<header className="space-y-3">
												<div className="flex flex-wrap items-center gap-2">
													<div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
														<HiOutlineUser className="h-5 w-5" />
													</div>

													<div className="min-w-0">
														<h3 className="truncate text-title text-foreground">
															{person.name}
														</h3>
														<p className="text-xs text-muted-foreground">
															{person.sex === "MALE" ? "Masculino" : "Feminino"}
														</p>
													</div>
												</div>

												<div className="flex flex-wrap gap-2">
													<span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-label text-muted-foreground">
														{person.isActive ? "Ativo" : "Inativo"}
													</span>
													<span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-label text-muted-foreground">
														{person.young ? "Jovem" : "Adulto"}
													</span>
													{person.isStudent ? (
														<span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-label text-muted-foreground">
															Estudante
														</span>
													) : null}
													{person.baptized ? (
														<span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-label text-muted-foreground">
															Batizado(a)
														</span>
													) : null}
													{person.isMarried ? (
														<span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-label text-muted-foreground">
															{person.spouse
																? `Casado(a) com ${person.spouse.name}`
																: "Casado(a)"}
														</span>
													) : null}
													{groupLabel ? (
														<span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-label text-muted-foreground">
															{isHead
																? `Chefe · ${groupLabel}`
																: `Família · ${groupLabel}`}
														</span>
													) : null}
													{person.user ? (
														<span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-label text-muted-foreground">
															Com usuário vinculado
														</span>
													) : null}
												</div>
											</header>

											<div className="flex flex-wrap gap-2">
												{person.servicePrivilege?.elder ? (
													<span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-label text-muted-foreground">
														Ancião
													</span>
												) : null}
												{person.servicePrivilege?.spiritualGems ? (
													<span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-label text-muted-foreground">
														Jóias espirituais
													</span>
												) : null}
												{person.servicePrivilege?.treasuresFromGodsWordTalk ? (
													<span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-label text-muted-foreground">
														Discurso Tesouros da Palavra de Deus
													</span>
												) : null}
												{person.servicePrivilege?.publicTalk ? (
													<span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-label text-muted-foreground">
														Discurso público
													</span>
												) : null}
												{person.bibleReading ? (
													<span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-label text-muted-foreground">
														Leitura da Bíblia
													</span>
												) : null}
												{person.sound ? (
													<span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-label text-muted-foreground">
														Som
													</span>
												) : null}
												{person.video ? (
													<span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-label text-muted-foreground">
														Vídeo
													</span>
												) : null}
												{person.cleaning ? (
													<span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-label text-muted-foreground">
														Limpeza
													</span>
												) : null}
												{person.privilegePrayer ? (
													<span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-label text-muted-foreground">
														Oração
													</span>
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
																className="inline-flex h-11 items-center justify-center gap-2 rounded-4xl border border-border bg-card px-4 text-sm font-medium text-foreground"
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
		</main>
	);
}
