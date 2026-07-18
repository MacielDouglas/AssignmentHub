import { CalendarDays, ChevronLeft, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ScheduleSettingsForm } from "@/features/schedule/components/schedule-settings-form";
import { mapScheduleSettingsFormInitialState } from "@/features/schedule/lib/map-schedule-settings-form-initial-state";
import { getScheduleSettingsQuery } from "@/features/schedule/queries/get-schedule-settings.query";
import { auth } from "@/lib/auth";

type OrganizationScheduleSettingsPageProps = {
	params: Promise<{
		slug: string;
	}>;
};

export async function generateMetadata({
	params,
}: OrganizationScheduleSettingsPageProps): Promise<Metadata> {
	const { slug } = await params;

	return {
		title: `${slug} | Agenda | AssignmentHub`,
		description:
			"Gerencie reuniões, limpezas e eventos especiais da organização.",
		robots: {
			index: false,
			follow: false,
		},
	};
}

export default async function OrganizationScheduleSettingsPage({
	params,
}: OrganizationScheduleSettingsPageProps) {
	const { slug } = await params;

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		notFound();
	}

	const data = await getScheduleSettingsQuery({
		slug,
		userId: session.user.id,
	});

	if (!data) {
		notFound();
	}

	const initialState = mapScheduleSettingsFormInitialState(data);
	// Chave estável baseada no organizationId + hash dos IDs dos itens do banco
	// Só muda quando itens são adicionados/removidos do banco, não durante edição
	const itemIds = initialState.items
		.filter((item) => item.id)
		.map((item) => item.id)
		.sort()
		.join(",");
	const formKey = `${initialState.organizationId}:${itemIds}`;

	return (
		<main className="space-y-6">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<Link
							href={`/org/${slug}/settings`}
							className="transition-colors hover:text-foreground"
						>
							Configurações
						</Link>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>Agenda</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<section
				aria-labelledby="agenda-heading"
				className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(37,99,235,0.14)_0%,rgba(124,58,237,0.14)_52%,rgba(255,255,255,0.02)_100%)] shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
			>
				<div className="relative p-5 sm:p-6 lg:p-8">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.14),transparent_28%)]" />
					<div className="relative space-y-5">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
							<div className="flex items-start gap-4">
								<div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/70 shadow-sm backdrop-blur dark:bg-white/10">
									<CalendarDays className="size-6 text-[#2563EB]" />
								</div>

								<div className="min-w-0 space-y-2">
									<div className="flex flex-wrap items-center gap-2">
										<Badge className="border-0 bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/10">
											Agenda
										</Badge>
										<Badge className="border-0 bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/10">
											Inteligente
										</Badge>
									</div>

									<div className="space-y-1">
										<h1
											id="agenda-heading"
											className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
										>
											Configurações da agenda
										</h1>
										<p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
											Defina reuniões, limpezas e eventos especiais com uma
											estrutura clara, direta e consistente para toda a
											organização.
										</p>
									</div>
								</div>
							</div>

							<Link
								href={`/org/${slug}/settings`}
								className="inline-flex items-center gap-2 self-start rounded-2xl border border-border/60 bg-background/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
							>
								<ChevronLeft className="size-4" />
								Voltar
							</Link>
						</div>

						<div className="grid gap-3 sm:grid-cols-3">
							<div className="rounded-2xl border border-border/50 bg-background/75 p-4 backdrop-blur">
								<p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
									Organização
								</p>
								<p className="mt-2 text-base font-semibold text-foreground">
									{data.organization.name}
								</p>
							</div>

							<div className="rounded-2xl border border-border/50 bg-background/75 p-4 backdrop-blur">
								<p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
									Agendas carregadas
								</p>
								<p className="mt-2 text-base font-semibold text-foreground">
									{initialState.items.length} itens
								</p>
							</div>

							<div className="rounded-2xl border border-border/50 bg-background/75 p-4 backdrop-blur">
								<p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
									Experiência
								</p>
								<div className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-foreground">
									<Sparkles className="size-4 text-[#7C3AED]" />
									Clara e responsiva
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<ScheduleSettingsForm key={formKey} initialState={initialState} organizationSlug={slug} />
		</main>
	);
}
