import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
	HiOutlineCheckBadge,
	HiOutlineCpuChip,
	HiOutlineSparkles,
	HiOutlineSquares2X2,
} from "react-icons/hi2";
import { HomeGoogleButton } from "@/features/auth/presentation/home-google-button";
import { auth } from "@/lib/auth";

export default async function HomePage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (session?.user) {
		redirect("/app");
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
								Reuniões, tarefas e IA com segurança
							</p>
						</div>
					</div>
				</header>

				<section className="grid flex-1 gap-10 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
					<div className="space-y-6">
						<div className="inline-flex items-center gap-2 border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
							<HiOutlineSparkles className="h-4 w-4" aria-hidden="true" />
							Plataforma inteligente para coordenação
						</div>

						<div className="space-y-4">
							<h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
								Organize pessoas, reuniões e designações com mais clareza,
								confiança e automação.
							</h1>

							<p className="max-w-2xl text-base leading-7 text-muted-foreground">
								O AssignmentHub foi criado para apoiar o gerenciamento de
								tarefas, reuniões e fluxos organizacionais com uma experiência
								moderna, segura e preparada para recursos de inteligência
								artificial.
							</p>
						</div>

						<div className="grid gap-3 sm:grid-cols-3">
							<div className="border border-border bg-card p-4">
								<div className="mb-3 flex h-10 w-10 items-center justify-center bg-blue-50 text-blue-600">
									<HiOutlineCheckBadge className="h-5 w-5" aria-hidden="true" />
								</div>
								<h2 className="text-sm font-semibold text-foreground">
									Confiança
								</h2>
								<p className="mt-2 text-sm leading-6 text-muted-foreground">
									Estrutura pensada para apoiar designações corretas e
									consistentes.
								</p>
							</div>

							<div className="border border-border bg-card p-4">
								<div className="mb-3 flex h-10 w-10 items-center justify-center bg-violet-50 text-violet-600">
									<HiOutlineCpuChip className="h-5 w-5" aria-hidden="true" />
								</div>
								<h2 className="text-sm font-semibold text-foreground">
									Tecnologia
								</h2>
								<p className="mt-2 text-sm leading-6 text-muted-foreground">
									IA e automação para reduzir trabalho manual e melhorar o
									fluxo.
								</p>
							</div>

							<div className="border border-border bg-card p-4">
								<div className="mb-3 flex h-10 w-10 items-center justify-center bg-slate-100 text-slate-700">
									<HiOutlineSquares2X2 className="h-5 w-5" aria-hidden="true" />
								</div>
								<h2 className="text-sm font-semibold text-foreground">
									Organização
								</h2>
								<p className="mt-2 text-sm leading-6 text-muted-foreground">
									Coordene reuniões, pessoas e tarefas em um ambiente claro e
									centralizado.
								</p>
							</div>
						</div>

						<div className="pt-2">
							<HomeGoogleButton />
						</div>
					</div>

					<aside className="relative overflow-hidden border border-border bg-card p-6 sm:p-8">
						<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.12),transparent_35%)]" />
						<div className="relative space-y-6">
							<div className="space-y-2">
								<p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">
									Fluxo de acesso
								</p>
								<h2 className="text-2xl font-semibold leading-tight text-foreground">
									Entre com sua conta Google e continue com segurança.
								</h2>
							</div>

							<div className="space-y-4 text-sm leading-6 text-muted-foreground">
								<div className="border border-border bg-background p-4">
									<p className="font-medium text-foreground">1. Autenticação</p>
									<p className="mt-1">
										O acesso começa com login social simples e seguro.
									</p>
								</div>

								<div className="border border-border bg-background p-4">
									<p className="font-medium text-foreground">
										2. Verificação de vínculo
									</p>
									<p className="mt-1">
										O sistema identifica se sua conta pertence a uma
										organização.
									</p>
								</div>

								<div className="border border-border bg-background p-4">
									<p className="font-medium text-foreground">
										3. Redirecionamento inteligente
									</p>
									<p className="mt-1">
										Você segue para a sua organização ou para a página de
										boas-vindas.
									</p>
								</div>
							</div>
						</div>
					</aside>
				</section>
			</section>
		</main>
	);
}
