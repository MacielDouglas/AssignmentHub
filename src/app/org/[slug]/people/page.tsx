import {
	Baby,
	BadgeCheck,
	BookOpen,
	Crown,
	GraduationCap,
	Mic,
	Shield,
	User,
	Users,
	Video,
	Volume2,
} from "lucide-react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { PersonFormDialog } from "@/features/people/components/person-form-dialog";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type PeoplePageProps = {
	params: Promise<{
		slug: string;
	}>;
};

type PersonItem = {
	id: string;
	name: string;
	sex: "MALE" | "FEMALE";
	isActive: boolean;
	isStudent: boolean;
	familyId: string | null;
	headedFamily: {
		id: string;
		name: string;
	} | null;
	family: {
		id: string;
		name: string;
	} | null;
	baptized: boolean;
	young: boolean;
	initiatingConversations: boolean;
	cultivatingInterest: boolean;
	makingDisciples: boolean;
	explainingBeliefs: boolean;
	cleaning: boolean;
	bibleReading: boolean;
	roamingMic: boolean;
	sound: boolean;
	video: boolean;
	stage: boolean;
	bibleStudyReader: boolean;
	watchtowerReader: boolean;
	attendant: boolean;
	privilegePrayer: boolean;
	servicePrivilege: {
		elder: boolean;
		publicTalk: boolean;
		lifeAndMinistryChairman: boolean;
		weekendChairman: boolean;
		ourChristianLifeAssignment: boolean;
		localNeeds: boolean;
		bibleStudyConductor: boolean;
		watchtowerConductor: boolean;
	} | null;
};

type RenderedPerson = {
	person: PersonItem;
	groupLabel: string | null;
	isHead: boolean;
	sortKey: string;
};

function normalizeText(value: string) {
	return value
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.trim();
}

function compareText(a: string, b: string) {
	return normalizeText(a).localeCompare(normalizeText(b), "pt-BR");
}

function buildRenderedPeople(people: PersonItem[]): RenderedPerson[] {
	const familyMap = new Map<
		string,
		{
			familyName: string;
			head: PersonItem | null;
			members: PersonItem[];
		}
	>();

	const singles: RenderedPerson[] = [];

	for (const person of people) {
		const headedFamily = person.headedFamily;
		const memberFamily = person.family;

		if (headedFamily) {
			const current = familyMap.get(headedFamily.id);

			if (current) {
				current.head = person;
			} else {
				familyMap.set(headedFamily.id, {
					familyName: headedFamily.name,
					head: person,
					members: [],
				});
			}

			continue;
		}

		if (memberFamily) {
			const current = familyMap.get(memberFamily.id);

			if (current) {
				current.members.push(person);
			} else {
				familyMap.set(memberFamily.id, {
					familyName: memberFamily.name,
					head: null,
					members: [person],
				});
			}

			continue;
		}

		singles.push({
			person,
			groupLabel: null,
			isHead: false,
			sortKey: normalizeText(person.name),
		});
	}

	singles.sort((a, b) => compareText(a.person.name, b.person.name));

	const familyGroups = Array.from(familyMap.values()).sort((a, b) =>
		compareText(a.familyName, b.familyName),
	);

	const familyRendered: RenderedPerson[] = [];

	for (const group of familyGroups) {
		if (group.head) {
			familyRendered.push({
				person: group.head,
				groupLabel: group.familyName,
				isHead: true,
				sortKey: normalizeText(group.familyName),
			});
		}

		const sortedMembers = [...group.members].sort((a, b) =>
			compareText(a.name, b.name),
		);

		for (const member of sortedMembers) {
			familyRendered.push({
				person: member,
				groupLabel: group.familyName,
				isHead: false,
				sortKey: normalizeText(group.familyName),
			});
		}
	}

	const merged = [...singles, ...familyRendered];

	merged.sort((a, b) => {
		const byGroup = compareText(a.sortKey, b.sortKey);
		if (byGroup !== 0) return byGroup;

		if (a.groupLabel && b.groupLabel) {
			if (a.isHead !== b.isHead) {
				return a.isHead ? -1 : 1;
			}

			return compareText(a.person.name, b.person.name);
		}

		if (!a.groupLabel && !b.groupLabel) {
			return compareText(a.person.name, b.person.name);
		}

		if (!a.groupLabel && b.groupLabel) {
			return compareText(a.person.name, b.groupLabel);
		}

		if (a.groupLabel && !b.groupLabel) {
			return compareText(a.groupLabel, b.person.name);
		}

		return 0;
	});

	return merged;
}

function PersonBadge({
	icon,
	label,
}: {
	icon: React.ReactNode;
	label: string;
}) {
	return (
		<span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-muted-foreground">
			{icon}
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
					families: {
						orderBy: {
							name: "asc",
						},
						select: {
							id: true,
							name: true,
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
							isActive: true,
							isStudent: true,
							familyId: true,
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
							servicePrivilege: {
								select: {
									elder: true,
									publicTalk: true,
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

	const renderedPeople = buildRenderedPeople(
		organization.people as PersonItem[],
	);

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold">Pessoas</h1>
					<p className="text-sm text-muted-foreground">
						Gerencie pessoas, famílias e privilégios da organização.
					</p>
				</div>

				{canManagePeople ? (
					<PersonFormDialog
						slug={organization.slug}
						mode="create"
						families={families}
						trigger={
							<button
								type="button"
								className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
							>
								Nova pessoa
							</button>
						}
					/>
				) : null}
			</div>

			<div className="rounded-lg border">
				{renderedPeople.length === 0 ? (
					<div className="p-6 text-sm text-muted-foreground">
						Nenhuma pessoa cadastrada.
					</div>
				) : (
					<div className="divide-y">
						{renderedPeople.map(({ person, groupLabel, isHead }) => (
							<div
								key={person.id}
								className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
							>
								<div className="space-y-3">
									<div className="flex flex-wrap items-center gap-2">
										<div className="inline-flex items-center gap-2">
											{person.young ? (
												<Baby className="h-4 w-4 text-muted-foreground" />
											) : (
												<User className="h-4 w-4 text-muted-foreground" />
											)}

											<h2 className="font-medium">{person.name}</h2>
										</div>

										<span className="rounded-full border px-2 py-0.5 text-xs">
											{person.sex === "MALE" ? "Masculino" : "Feminino"}
										</span>

										<span className="rounded-full border px-2 py-0.5 text-xs">
											{person.isActive ? "Ativo" : "Inativo"}
										</span>

										{groupLabel ? (
											<span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
												{isHead ? (
													<Crown className="h-3.5 w-3.5" />
												) : (
													<Users className="h-3.5 w-3.5" />
												)}
												{isHead
													? `Chefe família ${groupLabel}`
													: `Família ${groupLabel}`}
											</span>
										) : null}
									</div>

									<div className="flex flex-wrap gap-2">
										<PersonBadge
											icon={
												person.young ? (
													<Baby className="h-3.5 w-3.5" />
												) : (
													<User className="h-3.5 w-3.5" />
												)
											}
											label={person.young ? "Jovem" : "Adulto"}
										/>

										{person.isStudent ? (
											<PersonBadge
												icon={<GraduationCap className="h-3.5 w-3.5" />}
												label="Estudante"
											/>
										) : null}

										{person.baptized ? (
											<PersonBadge
												icon={<BadgeCheck className="h-3.5 w-3.5" />}
												label={`Batizad${person.sex === "MALE" ? "o" : "a"}`}
											/>
										) : null}

										{person.servicePrivilege?.elder ? (
											<PersonBadge
												icon={<Shield className="h-3.5 w-3.5" />}
												label="Ancião"
											/>
										) : null}

										{person.servicePrivilege?.publicTalk ? (
											<PersonBadge
												icon={<Mic className="h-3.5 w-3.5" />}
												label="Discurso público"
											/>
										) : null}

										{person.bibleReading ? (
											<PersonBadge
												icon={<BookOpen className="h-3.5 w-3.5" />}
												label="Leitura da Bíblia"
											/>
										) : null}

										{person.sound ? (
											<PersonBadge
												icon={<Volume2 className="h-3.5 w-3.5" />}
												label="Som"
											/>
										) : null}

										{person.video ? (
											<PersonBadge
												icon={<Video className="h-3.5 w-3.5" />}
												label="Vídeo"
											/>
										) : null}
									</div>
								</div>

								{canManagePeople ? (
									<PersonFormDialog
										slug={organization.slug}
										mode="edit"
										families={families}
										person={person}
										trigger={
											<button
												type="button"
												className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
											>
												Editar
											</button>
										}
									/>
								) : null}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
