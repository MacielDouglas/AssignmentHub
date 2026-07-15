import {
	BrushCleaning,
	Building2,
	CalendarDays,
	ChevronRight,
	Settings2,
	Shield,
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

	return (
		<div className="space-y-6">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbPage>Configurações</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<section aria-labelledby="settings-heading" className="space-y-4">
				<Card>
					<CardHeader className="space-y-4">
						<div className="flex items-start gap-3">
							<div className="flex size-11 items-center justify-center rounded-xl border bg-muted">
								<Settings2 className="size-5" />
							</div>

							<div className="min-w-0 space-y-2">
								<CardTitle id="settings-heading" className="text-xl">
									Configurações da organização
								</CardTitle>
								<CardDescription className="max-w-2xl">
									Gerencie os módulos e preferências da organização de forma
									centralizada.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
				</Card>
			</section>

			<section
				aria-labelledby="organization-overview-heading"
				className="grid gap-4 md:grid-cols-2"
			>
				<h2 id="organization-overview-heading" className="sr-only">
					Visão geral da organização
				</h2>

				<Card>
					<CardHeader>
						<CardDescription>Nome da organização</CardDescription>
						<CardTitle className="text-lg">{data.organization.name}</CardTitle>
					</CardHeader>
					<CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
						<Building2 className="size-4" />
						<span>Slug: {data.organization.slug}</span>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardDescription className="flex items-center gap-2">
							<Shield className="size-4" />
							Permissão atual
						</CardDescription>
						<CardTitle className="text-lg">{data.role}</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							{data.canManageOrganization
								? "Você pode gerenciar esta organização."
								: "Você possui acesso somente leitura."}
						</p>
					</CardContent>
				</Card>
			</section>

			<section aria-labelledby="modules-heading" className="space-y-3">
				<div className="space-y-1">
					<h2 id="modules-heading" className="text-base font-semibold">
						Módulos
					</h2>
					<p className="text-sm text-muted-foreground">
						Acesse as configurações específicas de cada módulo.
					</p>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<Card className="overflow-hidden">
						<CardContent className="p-0">
							<Link
								href={`/org/${data.organization.slug}/settings/cleaning`}
								className="flex h-full flex-col gap-4 p-4 transition-colors hover:bg-muted/40 sm:p-5"
							>
								<div className="flex items-start gap-3">
									<div className="flex size-10 items-center justify-center rounded-xl border bg-muted">
										<BrushCleaning className="size-4" />
									</div>

									<div className="min-w-0 flex-1 space-y-2">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<h3 className="font-medium">Limpeza</h3>
											<Badge
												variant={cleaningSettings ? "secondary" : "outline"}
											>
												{cleaningSettings ? "Configurado" : "Pendente"}
											</Badge>
										</div>

										<p className="text-sm text-muted-foreground">
											Configure limpeza por reunião, limpeza semanal e limpeza
											geral.
										</p>

										<p className="text-xs text-muted-foreground">
											{cleaningSummary}
										</p>
									</div>

									<ChevronRight className="mt-1 hidden size-4 shrink-0 text-muted-foreground sm:block" />
								</div>
							</Link>
						</CardContent>
					</Card>

					<Card className="overflow-hidden">
						<CardContent className="p-0">
							<Link
								href={`/org/${data.organization.slug}/settings/data`}
								className="flex h-full flex-col gap-4 p-4 transition-colors hover:bg-muted/40 sm:p-5"
							>
								<div className="flex items-start gap-3">
									<div className="flex size-10 items-center justify-center rounded-xl border bg-muted">
										<CalendarDays className="size-4" />
									</div>

									<div className="min-w-0 flex-1 space-y-2">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<h3 className="font-medium">Datas</h3>
											<Badge
												variant={
													configuredSchedules.length > 0
														? "secondary"
														: "outline"
												}
											>
												{configuredSchedules.length > 0
													? "Configurado"
													: "Pendente"}
											</Badge>
										</div>

										<p className="text-sm text-muted-foreground">
											Configure reuniões, limpezas e eventos especiais da
											organização.
										</p>

										<p className="text-xs text-muted-foreground">
											{datesSummary}
										</p>
									</div>

									<ChevronRight className="mt-1 hidden size-4 shrink-0 text-muted-foreground sm:block" />
								</div>
							</Link>
						</CardContent>
					</Card>
				</div>
			</section>
		</div>
	);
}
