import {
	BadgeCheck,
	CircleOff,
	GraduationCap,
	Link2,
	Mars,
	Pencil,
	Unlink2,
	Venus,
} from "lucide-react";
import { notFound } from "next/navigation";

import { CreatePersonForm } from "@/features/people/components/create-person-form";
import { EditPersonDialog } from "@/features/people/components/edit-person-dialog";
import { LinkUserToPersonForm } from "@/features/people/components/link-user-to-person-form";
import { getPendingUsers } from "@/features/people/queries/pending-users";
import { db } from "@/lib/db";

type PageProps = {
	params: Promise<{
		slug: string;
	}>;
};

export default async function OrganizationPeoplePage({ params }: PageProps) {
	const { slug } = await params;

	const [organization, pendingUsers] = await Promise.all([
		db.organization.findUnique({
			where: { slug },
			select: {
				id: true,
				name: true,
				slug: true,
				people: {
					orderBy: { name: "asc" },
					select: {
						id: true,
						name: true,
						sex: true,
						isActive: true,
						isStudent: true,
						user: {
							select: {
								id: true,
								email: true,
								memberships: {
									select: {
										role: true,
										organizationId: true,
									},
								},
							},
						},
					},
				},
			},
		}),
		getPendingUsers(),
	]);

	if (!organization) {
		notFound();
	}

	return (
		<div className="space-y-8 p-6">
			<header className="space-y-2">
				<h1 className="text-2xl font-semibold">Pessoas</h1>
				<p className="text-sm text-muted-foreground">
					Gerencie as pessoas e vincule usuários à organização{" "}
					{organization.name}.
				</p>
			</header>

			<section className="grid gap-6 md:grid-cols-2">
				<div className="rounded-xl border p-4">
					<h2 className="mb-4 text-lg font-medium">Nova pessoa</h2>
					<CreatePersonForm slug={organization.slug} />
				</div>

				<div className="rounded-xl border p-4">
					<h2 className="mb-4 text-lg font-medium">Usuários pendentes</h2>
					{pendingUsers.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							Não há usuários pendentes de vínculo.
						</p>
					) : (
						<LinkUserToPersonForm
							slug={organization.slug}
							organizationId={organization.id}
							pendingUsers={pendingUsers}
							people={organization.people}
						/>
					)}
				</div>
			</section>

			<section className="rounded-xl border">
				<div className="border-b px-4 py-3">
					<h2 className="text-lg font-medium">Lista de pessoas</h2>
				</div>

				<div className="divide-y">
					{organization.people.length === 0 ? (
						<div className="px-4 py-6 text-sm text-muted-foreground">
							Nenhuma pessoa cadastrada.
						</div>
					) : (
						organization.people.map((person) => {
							const membership = person.user?.memberships.find(
								(item) => item.organizationId === organization.id,
							);

							return (
								<EditPersonDialog
									key={person.id}
									slug={organization.slug}
									person={{
										id: person.id,
										name: person.name,
										sex: person.sex,
										isActive: person.isActive,
										isStudent: person.isStudent,
									}}
									trigger={
										<button
											type="button"
											className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/40"
										>
											<div className="space-y-2">
												<p className="font-medium">{person.name}</p>

												<div className="flex items-center gap-3 text-muted-foreground">
													{person.sex === "MALE" ? (
														<span
															title="Masculino"
															className="inline-flex items-center"
														>
															<Mars className="h-4 w-4" aria-hidden="true" />
															<span className="sr-only">Masculino</span>
														</span>
													) : (
														<span
															title="Feminino"
															className="inline-flex items-center"
														>
															<Venus className="h-4 w-4" aria-hidden="true" />
														</span>
													)}

													<span
														title={
															person.isStudent ? "Estudante" : "Não estudante"
														}
														className="inline-flex items-center"
													>
														<GraduationCap
															className={`h-4 w-4 ${
																person.isStudent
																	? "text-blue-600"
																	: "text-muted-foreground/40"
															}`}
														/>
													</span>

													<span
														title={person.isActive ? "Ativo" : "Inativo"}
														className="inline-flex items-center"
													>
														{person.isActive ? (
															<BadgeCheck
																className="h-4 w-4 text-green-600"
																aria-hidden="true"
															/>
														) : (
															<CircleOff
																className="h-4 w-4 text-rose-600"
																aria-hidden="true"
															/>
														)}
														<span className="sr-only">
															{person.isActive ? "Ativo" : "Inativo"}
														</span>
													</span>

													<span
														title={
															person.user
																? "Usuário vinculado"
																: "Sem usuário vinculado"
														}
														className="inline-flex items-center"
													>
														{person.user ? (
															<Link2 className="h-4 w-4 text-violet-600" />
														) : (
															<Unlink2 className="h-4 w-4 text-muted-foreground/50" />
														)}
													</span>
												</div>
											</div>

											<div className="flex items-center gap-3">
												<div className="text-right text-sm">
													{person.user ? (
														<div className="space-y-1">
															<p>{person.user.email}</p>
															<p className="text-muted-foreground">
																{membership?.role ?? "Sem papel"}
															</p>
														</div>
													) : (
														<p className="text-muted-foreground">
															Sem usuário vinculado
														</p>
													)}
												</div>

												<Pencil className="h-4 w-4 text-muted-foreground" />
											</div>
										</button>
									}
								/>
							);
						})
					)}
				</div>
			</section>
		</div>
	);
}
