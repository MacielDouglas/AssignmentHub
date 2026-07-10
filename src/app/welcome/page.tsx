import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
	HiOutlineArrowLeft,
	HiOutlineBolt,
	HiOutlineBuildingOffice2,
	HiOutlineCheckBadge,
	HiOutlineCpuChip,
	HiOutlineSquares2X2,
	HiOutlineUsers,
} from "react-icons/hi2";
import { LogoutButton } from "@/components/auth/logout-button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";

export default async function WelcomePage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/");
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
								Workflow, reuniões e IA com confiança
							</p>
						</div>
					</div>

					<Link
						href="/"
						className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
					>
						<HiOutlineArrowLeft className="h-4 w-4" aria-hidden="true" />
						Voltar <LogoutButton />
					</Link>
				</header>

				<section className="grid flex-1 gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
					<div className="space-y-6">
						<div className="inline-flex items-center gap-2 border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
							<HiOutlineCheckBadge className="h-4 w-4" aria-hidden="true" />
							Acesso autenticado com sucesso
						</div>

						<div className="space-y-4">
							<h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
								Seu acesso foi reconhecido, mas ainda falta o vínculo com uma
								organização.
							</h1>

							<p className="max-w-2xl text-base leading-7 text-muted-foreground">
								Obrigado pelo seu interesse no AssignmentHub. Para continuar,
								sua conta precisa estar vinculada a uma organização ativa dentro
								da plataforma.
							</p>

							<p className="max-w-2xl text-base leading-7 text-muted-foreground">
								Assim que esse vínculo for criado, você poderá acessar o
								ambiente da sua organização para gerenciar reuniões, tarefas,
								pessoas e fluxos apoiados por inteligência artificial.
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
									Estrutura pensada para reduzir erros e aumentar precisão nas
									designações.
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
									Automação e IA para apoiar decisões e organizar melhor o
									trabalho.
								</p>
							</div>

							<div className="border border-border bg-card p-4">
								<div className="mb-3 flex h-10 w-10 items-center justify-center bg-slate-100 text-slate-700">
									<HiOutlineUsers className="h-5 w-5" aria-hidden="true" />
								</div>
								<h2 className="text-sm font-semibold text-foreground">
									Organização
								</h2>
								<p className="mt-2 text-sm leading-6 text-muted-foreground">
									Fluxo claro para equipes, reuniões, pessoas e tarefas
									recorrentes.
								</p>
							</div>
						</div>

						<div className="flex flex-col gap-3 sm:flex-row">
							<a
								href="mailto:contato@assignmenthub.app"
								className="inline-flex h-11 items-center justify-center gap-2 rounded-none bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-95"
							>
								<HiOutlineBuildingOffice2
									className="h-4 w-4"
									aria-hidden="true"
								/>
								Solicitar vínculo com organização
							</a>

							<Link
								href="/"
								className="inline-flex h-11 items-center justify-center gap-2 rounded-none border border-border bg-background px-5 text-sm font-medium text-foreground hover:bg-muted"
							>
								<HiOutlineArrowLeft className="h-4 w-4" aria-hidden="true" />
								Ir para a página inicial
							</Link>
						</div>
					</div>

					<aside className="grid gap-4">
						<Card className="rounded-none border-border shadow-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base">
									<HiOutlineBuildingOffice2
										className="h-5 w-5 text-blue-600"
										aria-hidden="true"
									/>
									Vínculo organizacional
								</CardTitle>
								<CardDescription>
									O acesso operacional depende de pertencer a uma organização
									cadastrada.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm leading-6 text-muted-foreground">
									Um administrador da organização precisa adicionar você como
									membro para liberar o ambiente interno do sistema.
								</p>
							</CardContent>
						</Card>

						<Card className="rounded-none border-border shadow-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base">
									<HiOutlineBolt
										className="h-5 w-5 text-violet-600"
										aria-hidden="true"
									/>
									Fluxo inteligente
								</CardTitle>
								<CardDescription>
									Reuniões, tarefas e designações com apoio tecnológico.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm leading-6 text-muted-foreground">
									O AssignmentHub foi projetado para centralizar trabalho,
									clareza operacional e consistência nas rotinas da organização.
								</p>
							</CardContent>
						</Card>
					</aside>
				</section>
			</section>
		</main>
	);
}
