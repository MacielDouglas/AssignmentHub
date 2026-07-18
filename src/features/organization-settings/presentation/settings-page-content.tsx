import type { VariantProps } from "class-variance-authority";
import {
	ArrowUpRight,
	BrushCleaning,
	Building2,
	CalendarDays,
	ChevronRight,
	Settings2,
	Shield,
	Sparkles,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { getOrganizationSettingsDataQuery } from "../queries/get-organization-settings-data.query";

type SettingsPageContentData = NonNullable<
	Awaited<ReturnType<typeof getOrganizationSettingsDataQuery>>
>;

type ScheduleItem =
	SettingsPageContentData["organization"]["schedules"][number];

type VisibleScheduleType = Exclude<
	ScheduleItem["type"],
	"FIELD_SERVICE_MEETING"
>;

type BadgeVariant = VariantProps<typeof Badge>["variant"];

type VisibleScheduleItem = Omit<ScheduleItem, "type"> & {
	type: VisibleScheduleType;
};

type SettingsPageContentProps = {
	data: SettingsPageContentData;
};

const SCHEDULE_TYPE_LABEL: Record<VisibleScheduleType, string> = {
	MEETINGS: "Reuniões",
	SPECIAL_MEETING: "Reunião especial",
	TRAVELING_OVERSEER_VISIT: "Visita do viajante",
	CELEBRATION: "Celebração",
	SPECIAL_TALK: "Discurso especial",
	CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER: "Assembleia com viajante",
	CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE: "Assembleia com representante",
	CONVENTION: "Congresso",
	WEEKLY_CLEANING: "Limpeza semanal",
	GENERAL_CLEANING: "Limpeza geral",
};

function isVisibleScheduleItem(
	item: ScheduleItem,
): item is VisibleScheduleItem {
	return item.type !== "FIELD_SERVICE_MEETING";
}

function getRoleLabel(role: SettingsPageContentData["role"]) {
	switch (role) {
		case "OWNER":
			return "Proprietário";
		case "ADMIN":
			return "Administrador";
		default:
			return "Membro";
	}
}

export function SettingsPageContent({ data }: SettingsPageContentProps) {
	const cleaningSettings = data.organization.cleaningSettings;

	const cleaningSummary = cleaningSettings
		? [
				cleaningSettings.cleaningPerMeeting ? "Por reunião" : null,
				cleaningSettings.weeklyCleaning ? "Semanal" : null,
				cleaningSettings.generalCleaning ? "Geral" : null,
			]
				.filter(Boolean)
				.join(", ")
		: "Nenhuma configuração criada";

	const visibleSchedules = data.organization.schedules.filter(
		isVisibleScheduleItem,
	);

	const configuredSchedules = visibleSchedules.filter(
		(item) =>
			item.isActive ||
			item.weeklyRules.length > 0 ||
			item.occurrences.length > 0,
	);

	const datesSummary =
		configuredSchedules.length > 0
			? configuredSchedules
					.slice(0, 3)
					.map((item) => SCHEDULE_TYPE_LABEL[item.type])
					.join(", ")
			: "Nenhuma configuração criada";

	const modules: Array<{
		title: string;
		href: string;
		icon: typeof BrushCleaning;
		status: string;
		statusVariant: BadgeVariant;
		description: string;
		summary: string;
		accent: string;
	}> = [
		{
			title: "Limpeza",
			href: `/org/${data.organization.slug}/settings/cleaning`,
			icon: BrushCleaning,
			status: cleaningSettings ? "Configurado" : "Pendente",
			statusVariant: cleaningSettings ? "secondary" : "outline",
			description:
				"Configure limpeza por reunião, limpeza semanal e limpeza geral.",
			summary: cleaningSummary,
			accent: "from-[#2563EB]/20 via-[#2563EB]/10 to-transparent",
		},
		{
			title: "Agenda",
			href: `/org/${data.organization.slug}/settings/agenda`,
			icon: CalendarDays,
			status: configuredSchedules.length > 0 ? "Configurado" : "Pendente",
			statusVariant: configuredSchedules.length > 0 ? "secondary" : "outline",
			description:
				"Configure reuniões, eventos especiais, congressos e visitas.",
			summary: datesSummary,
			accent: "from-[#7C3AED]/20 via-[#7C3AED]/10 to-transparent",
		},
	];

	return (
		<main className="space-y-6">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbPage>Configurações</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<section
				aria-labelledby="settings-heading"
				className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(37,99,235,0.14)_0%,rgba(124,58,237,0.14)_55%,rgba(255,255,255,0.02)_100%)] shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
			>
				<div className="relative p-5 sm:p-6 lg:p-8">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.16),transparent_28%)]" />
					<div className="relative space-y-6">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
							<div className="flex items-start gap-4">
								<div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/70 shadow-sm backdrop-blur dark:bg-white/10">
									<Settings2 className="size-6 text-[#2563EB]" />
								</div>

								<div className="min-w-0 space-y-2">
									<div className="flex flex-wrap items-center gap-2">
										<Badge className="border-0 bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/10">
											Painel central
										</Badge>
										<Badge className="border-0 bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/10">
											Profissional
										</Badge>
									</div>

									<h1
										id="settings-heading"
										className="text-2xl font-semibold tracking-tight sm:text-3xl"
									>
										Configurações da organização
									</h1>

									<p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
										Um painel elegante para centralizar agenda, limpeza e
										preferências da organização com clareza, segurança e ritmo
										visual consistente.
									</p>
								</div>
							</div>

							<div className="rounded-2xl border border-white/20 bg-white/70 px-4 py-3 text-left shadow-sm backdrop-blur dark:bg-white/5">
								<p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
									Permissão atual
								</p>
								<p className="mt-1 text-sm font-semibold">
									{getRoleLabel(data.role)}
								</p>
							</div>
						</div>

						<div className="grid gap-3 sm:grid-cols-3">
							<div className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-sm backdrop-blur dark:bg-white/5">
								<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
									Organização
								</p>
								<p className="mt-2 text-base font-semibold">
									{data.organization.name}
								</p>
								<p className="mt-1 text-sm text-muted-foreground">
									Slug: {data.organization.slug}
								</p>
							</div>

							<div className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-sm backdrop-blur dark:bg-white/5">
								<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
									Módulos ativos
								</p>
								<p className="mt-2 text-base font-semibold">
									{[
										cleaningSettings ? "Limpeza" : null,
										configuredSchedules.length > 0 ? "Agenda" : null,
									]
										.filter(Boolean)
										.join(" • ") || "Nenhum módulo configurado"}
								</p>
								<p className="mt-1 text-sm text-muted-foreground">
									Visão rápida do estado atual.
								</p>
							</div>

							<div className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-sm backdrop-blur dark:bg-white/5">
								<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
									Configurações concluídas
								</p>
								<p className="mt-2 text-base font-semibold">
									{data.stats.configuredSchedules} de{" "}
									{data.stats.totalSchedules} itens de agenda
								</p>
								<p className="mt-1 text-sm text-muted-foreground">
									Evolução consolidada dos cadastros.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section
				aria-labelledby="organization-overview-heading"
				className="grid gap-4 xl:grid-cols-2"
			>
				<h2 id="organization-overview-heading" className="sr-only">
					Visão geral da organização
				</h2>

				<Card className="rounded-[28px] border-border/60 bg-card/95 shadow-sm">
					<CardHeader className="space-y-3">
						<CardDescription className="flex items-center gap-2 text-xs uppercase tracking-[0.14em]">
							<Building2 className="size-4" />
							Organização
						</CardDescription>
						<CardTitle className="text-xl">{data.organization.name}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm text-muted-foreground">
						<p>Slug público: {data.organization.slug}</p>
						<p>
							Painel central para gerenciar módulos e preferências internas.
						</p>
					</CardContent>
				</Card>

				<Card className="rounded-[28px] border-border/60 bg-card/95 shadow-sm">
					<CardHeader className="space-y-3">
						<CardDescription className="flex items-center gap-2 text-xs uppercase tracking-[0.14em]">
							<Shield className="size-4" />
							Acesso e governança
						</CardDescription>
						<CardTitle className="text-xl">{getRoleLabel(data.role)}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm text-muted-foreground">
						<p>
							{data.canManageOrganization
								? "Você pode alterar configurações estruturais desta organização."
								: "Você possui acesso somente leitura para acompanhamento."}
						</p>
						<p>
							O painel mantém a organização centralizada e mais previsível para
							operação.
						</p>
					</CardContent>
				</Card>
			</section>

			<section aria-labelledby="modules-heading" className="space-y-4">
				<div className="space-y-1">
					<h2
						id="modules-heading"
						className="text-lg font-semibold tracking-tight"
					>
						Módulos
					</h2>
					<p className="text-sm text-muted-foreground">
						Acesse as configurações específicas de cada módulo com navegação
						clara e direta.
					</p>
				</div>

				<div className="grid gap-4 xl:grid-cols-2">
					{modules.map((module) => {
						const Icon = module.icon;

						return (
							<Card
								key={module.title}
								className="group overflow-hidden rounded-[28px] border-border/60 bg-card/95 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
							>
								<CardContent className="p-0">
									<Link
										href={module.href}
										className="relative flex h-full flex-col overflow-hidden p-5 sm:p-6"
									>
										<div
											className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-br ${module.accent}`}
										/>

										<div className="relative flex h-full flex-col gap-5">
											<div className="flex items-start gap-4">
												<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/80 shadow-sm backdrop-blur dark:bg-white/10">
													<Icon className="size-5 text-[#2563EB]" />
												</div>

												<div className="min-w-0 flex-1 space-y-3">
													<div className="flex flex-wrap items-center justify-between gap-2">
														<h3 className="text-lg font-semibold tracking-tight">
															{module.title}
														</h3>

														<Badge variant={module.statusVariant}>
															{module.status}
														</Badge>
													</div>

													<p className="text-sm leading-6 text-muted-foreground">
														{module.description}
													</p>
												</div>
											</div>

											<div className="rounded-2xl border border-border/60 bg-background/80 p-4">
												<p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
													<Sparkles className="size-3.5" />
													Resumo atual
												</p>
												<p className="mt-2 text-sm text-foreground">
													{module.summary}
												</p>
											</div>

											<div className="mt-auto flex items-center justify-between pt-1 text-sm font-medium">
												<span className="inline-flex items-center gap-2 text-[#2563EB]">
													Abrir módulo
													<ArrowUpRight className="size-4" />
												</span>

												<ChevronRight className="size-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
											</div>
										</div>
									</Link>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</section>
		</main>
	);
}
