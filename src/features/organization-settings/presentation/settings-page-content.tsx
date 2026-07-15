import {
	BrushCleaning,
	Building2,
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

type SettingsPageContentProps = {
	data: {
		role: "OWNER" | "ADMIN" | "MEMBER";
		canManageOrganization: boolean;
		organization: {
			id: string;
			name: string;
			slug: string;
			createdAt: Date;
			updatedAt: Date;
			cleaningSettings: {
				id: string;
				cleaningPerMeeting: boolean;
				weeklyCleaning: boolean;
				generalCleaning: boolean;
			} | null;
		};
	};
};

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
										<Badge variant={cleaningSettings ? "secondary" : "outline"}>
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
			</section>
		</div>
	);
}
