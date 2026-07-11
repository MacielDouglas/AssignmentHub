// src/app/org/[slug]/people/page.tsx
import { notFound } from "next/navigation";
import { CreatePersonForm } from "@/features/people/components/create-person-form";
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
								<div
									key={person.id}
									className="flex items-center justify-between gap-4 px-4 py-4"
								>
									<div className="space-y-1">
										<p className="font-medium">{person.name}</p>
										<div className="flex gap-2 text-sm text-muted-foreground">
											<span>
												{person.sex === "MALE" ? "Masculino" : "Feminino"}
											</span>
											<span>•</span>
											<span>
												{person.isStudent ? "Estudante" : "Não estudante"}
											</span>
											<span>•</span>
											<span>{person.isActive ? "Ativo" : "Inativo"}</span>
										</div>
									</div>

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
								</div>
							);
						})
					)}
				</div>
			</section>
		</div>
	);
}
