import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
	HiOutlineArrowLeft,
	HiOutlineBuildingOffice2,
	HiOutlineSquares2X2,
} from "react-icons/hi2";
import { OrganizationSelector } from "@/features/organization/presentation/organization-selector";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function SelectOrganizationPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/");
	}

	const memberships = await db.organizationMembership.findMany({
		where: {
			userId: session.user.id,
		},
		select: {
			role: true,
			organization: {
				select: {
					id: true,
					name: true,
					slug: true,
				},
			},
		},
		orderBy: {
			createdAt: "asc",
		},
	});

	const organizations = memberships.map((membership) => ({
		id: membership.organization.id,
		name: membership.organization.name,
		slug: membership.organization.slug,
		role: membership.role,
	}));

	if (organizations.length === 0) {
		redirect("/welcome");
	}

	if (organizations.length === 1) {
		redirect(`/org/${organizations[0].slug}`);
	}

	return (
		<main className="bg-background">
			<section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
				<header className="flex items-center justify-between border-b border-border py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-11 w-11 items-center justify-center rounded-none bg-linear-to-br from-blue-600 to-violet-600 text-white shadow-sm">
							<HiOutlineSquares2X2 className="h-5 w-5" aria-hidden="true" />
						</div>
						<div>
							<p className="text-sm font-semibold tracking-wide text-foreground">
								AssignmentHub
							</p>
							<p className="text-xs text-muted-foreground">
								Seleção de organização
							</p>
						</div>
					</div>

					<Link
						href="/"
						className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
					>
						<HiOutlineArrowLeft className="h-4 w-4" aria-hidden="true" />
						Voltar
					</Link>
				</header>

				<section className="grid flex-1 gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
					<div className="space-y-5">
						<div className="inline-flex items-center gap-2 border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">
							<HiOutlineBuildingOffice2
								className="h-4 w-4"
								aria-hidden="true"
							/>
							Múltiplas organizações encontradas
						</div>

						<div className="space-y-4">
							<h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
								Escolha a organização que você deseja acessar agora.
							</h1>

							<p className="max-w-2xl text-base leading-7 text-muted-foreground">
								Sua conta está vinculada a mais de uma organização. Selecione
								abaixo o ambiente que deseja abrir para continuar com segurança.
							</p>
						</div>

						<OrganizationSelector organizations={organizations} />
					</div>

					<aside className="border border-border bg-card p-6 sm:p-8">
						<div className="space-y-4">
							<p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
								Acesso contextual
							</p>

							<h2 className="text-2xl font-semibold leading-tight text-foreground">
								Cada organização possui contexto, membros e fluxos próprios.
							</h2>

							<p className="text-sm leading-6 text-muted-foreground">
								Ao selecionar uma organização, você entra no ambiente correto
								para visualizar reuniões, tarefas, designações e permissões
								daquele contexto.
							</p>
						</div>
					</aside>
				</section>
			</section>
		</main>
	);
}
