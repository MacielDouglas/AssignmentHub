import {
	HiOutlineCalendarDays,
	HiOutlineCheckBadge,
	HiOutlineClipboardDocumentList,
	HiOutlineUsers,
} from "react-icons/hi2";

type OrganizationPageProps = {
	params: Promise<{
		slug: string;
	}>;
};

export default async function OrganizationPage({
	params,
}: OrganizationPageProps) {
	const { slug } = await params;

	return (
		<div className="space-y-6">
			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<div className="border border-border bg-card p-5">
					<div className="mb-4 flex h-11 w-11 items-center justify-center bg-blue-50 text-blue-600">
						<HiOutlineClipboardDocumentList
							className="h-5 w-5"
							aria-hidden="true"
						/>
					</div>
					<p className="text-sm text-muted-foreground">Tarefas em aberto</p>
					<p className="mt-2 text-3xl font-semibold text-foreground">18</p>
				</div>

				<div className="border border-border bg-card p-5">
					<div className="mb-4 flex h-11 w-11 items-center justify-center bg-violet-50 text-violet-600">
						<HiOutlineCalendarDays className="h-5 w-5" aria-hidden="true" />
					</div>
					<p className="text-sm text-muted-foreground">Reuniões agendadas</p>
					<p className="mt-2 text-3xl font-semibold text-foreground">6</p>
				</div>

				<div className="border border-border bg-card p-5">
					<div className="mb-4 flex h-11 w-11 items-center justify-center bg-blue-50 text-blue-600">
						<HiOutlineCheckBadge className="h-5 w-5" aria-hidden="true" />
					</div>
					<p className="text-sm text-muted-foreground">Designações ativas</p>
					<p className="mt-2 text-3xl font-semibold text-foreground">24</p>
				</div>

				<div className="border border-border bg-card p-5">
					<div className="mb-4 flex h-11 w-11 items-center justify-center bg-slate-100 text-slate-700">
						<HiOutlineUsers className="h-5 w-5" aria-hidden="true" />
					</div>
					<p className="text-sm text-muted-foreground">Pessoas cadastradas</p>
					<p className="mt-2 text-3xl font-semibold text-foreground">42</p>
				</div>
			</section>

			<section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
				<div className="border border-border bg-card p-6">
					<p className="text-sm font-medium text-foreground">
						Resumo operacional
					</p>
					<p className="mt-2 text-sm leading-6 text-muted-foreground">
						Você está no ambiente da organização{" "}
						<span className="font-medium text-foreground">{slug}</span>. Aqui
						entraremos com o resumo de tarefas prioritárias, reuniões do dia e
						alertas de designação.
					</p>
				</div>

				<div className="border border-border bg-card p-6">
					<p className="text-sm font-medium text-foreground">Próximos passos</p>
					<ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
						<li>Criar a listagem inicial de tarefas.</li>
						<li>Montar a agenda de reuniões.</li>
						<li>Exibir designações automáticas e manuais.</li>
					</ul>
				</div>
			</section>
		</div>
	);
}
