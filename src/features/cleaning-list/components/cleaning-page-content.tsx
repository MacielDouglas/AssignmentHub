// src/features/cleaning-list/components/cleaning-page-content.tsx
import { BrushCleaning, ClipboardList, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CleaningPageData } from "../queries/get-cleaning-page-data.query";
import { CleaningGenerateTab } from "./cleaning-generate-tab";
import { CleaningSavedListTab } from "./cleaning-saved-list-tab";

type Props = { data: CleaningPageData };

export function CleaningPageContent({ data }: Props) {
	return (
		<main className="space-y-5 pb-8">
			<section className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(37,99,235,0.14)_0%,rgba(124,58,237,0.14)_55%,rgba(255,255,255,0.02)_100%)] shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
				<div className="relative p-5 sm:p-6">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.16),transparent_28%)]" />
					<div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
						<div className="flex items-start gap-4">
							<div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/70 shadow-sm backdrop-blur dark:bg-white/10">
								<BrushCleaning className="size-6 text-[#2563EB]" />
							</div>
							<div className="space-y-2">
								<div className="flex flex-wrap gap-2">
									<Badge className="border-0 bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/10">
										Escalas
									</Badge>
									<Badge className="border-0 bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/10">
										Rotação inteligente
									</Badge>
								</div>
								<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
									Escalas de limpeza
								</h1>
								<p className="max-w-2xl text-sm leading-6 text-muted-foreground">
									Gere listas automaticamente, revise nomes e salve por período.
									Datas de reunião vêm da agenda; semanal e geral vêm das
									configurações.
								</p>
							</div>
						</div>

						<div className="rounded-2xl border border-white/20 bg-white/70 px-4 py-3 text-sm shadow-sm backdrop-blur dark:bg-white/5">
							<p className="font-medium">{data.organization.name}</p>
							<p className="text-muted-foreground">
								{data.canManage
									? "Você pode gerar, salvar e apagar listas futuras."
									: "Acesso somente leitura."}
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="rounded-[28px] border border-border/60 bg-card/95 p-4 shadow-sm sm:p-6">
				<Tabs defaultValue="generate" className="space-y-5">
					<div className="overflow-x-auto pb-1">
						<TabsList className="inline-flex min-w-full justify-start gap-1 rounded-2xl border border-border/60 bg-muted/40 p-1">
							<TabsTrigger value="generate" className="rounded-xl px-4">
								<Sparkles className="mr-2 size-4" />
								Fazer designação
							</TabsTrigger>
							<TabsTrigger value="saved" className="rounded-xl px-4">
								<ClipboardList className="mr-2 size-4" />
								Tabelas salvas
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value="generate" className="mt-0">
						<CleaningGenerateTab data={data} />
					</TabsContent>
					<TabsContent value="saved" className="mt-0">
						<CleaningSavedListTab data={data} />
					</TabsContent>
				</Tabs>
			</section>
		</main>
	);
}
