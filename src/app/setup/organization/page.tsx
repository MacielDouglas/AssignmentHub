import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CreateOrganizationForm } from "@/features/organization/presentation/create-organization-form";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type SessionData = {
	user?: {
		id: string;
		name?: string | null;
	} | null;
};

export default async function SetupOrganizationPage() {
	const session = (await auth.api.getSession({
		headers: await headers(),
	})) as SessionData | null;

	if (!session?.user) {
		redirect("/");
	}

	const currentUser = await db.user.findUnique({
		where: { id: session.user.id },
		select: { systemRole: true },
	});

	const isSuperUser = currentUser?.systemRole === "SUPER_ADMIN";

	if (!isSuperUser) {
		redirect("/welcome");
	}

	return (
		<main className="bg-background">
			<section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6 lg:px-8">
				<div className="space-y-4 border border-border bg-card p-6">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">
							Configuração inicial
						</p>
						<h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
							Criar organização
						</h1>
						<p className="mt-3 text-sm leading-6 text-muted-foreground">
							Como super usuário da plataforma, você pode criar a primeira
							organização e adicionar os membros iniciais com perfis de acesso
							apropriados.
						</p>
					</div>

					<CreateOrganizationForm />
				</div>
			</section>
		</main>
	);
}
