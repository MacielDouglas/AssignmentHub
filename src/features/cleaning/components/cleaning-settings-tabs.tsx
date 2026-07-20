// src/features/cleaning/components/cleaning-settings-tabs.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
	CleaningSettingsFormState,
	CleaningTypeConfigFormState,
} from "../domain/cleaning-settings.types";
import { CleaningTypePanel } from "./cleaning-settings-type-panel";

type Props = {
	form: CleaningSettingsFormState;
	readOnly: boolean;
	onChange: (
		key: "meeting" | "weekly" | "general",
		value: CleaningTypeConfigFormState,
	) => void;
};

export function CleaningSettingsTabs({ form, readOnly, onChange }: Props) {
	return (
		<Tabs defaultValue="meeting" className="space-y-5">
			<div className="overflow-x-auto pb-1">
				<TabsList className="inline-flex min-w-full justify-start gap-1 rounded-2xl border border-border/60 bg-muted/40 p-1">
					<TabsTrigger value="meeting" className="rounded-xl px-4">
						Por reunião
					</TabsTrigger>
					<TabsTrigger value="weekly" className="rounded-xl px-4">
						Semanal
					</TabsTrigger>
					<TabsTrigger value="general" className="rounded-xl px-4">
						Geral
					</TabsTrigger>
				</TabsList>
			</div>

			<TabsContent value="meeting" className="mt-0">
				<CleaningTypePanel
					prefix="meeting"
					title="Limpeza por reunião"
					description="Usa as datas das reuniões 1 e 2 da agenda. Configure só modo e setores."
					config={form.meeting}
					readOnly={readOnly}
					modes={[
						{ value: "PERSON", label: "Pessoa" },
						{ value: "FAMILY", label: "Família" },
						{ value: "GROUP", label: "Grupo" },
					]}
					showWeekday={false}
					showDates={false}
					onChange={(value) => onChange("meeting", value)}
				/>
			</TabsContent>

			<TabsContent value="weekly" className="mt-0">
				<CleaningTypePanel
					prefix="weekly"
					title="Limpeza semanal"
					description="Escolha família ou grupo, um dia da semana (ou nenhum) e os setores."
					config={form.weekly}
					readOnly={readOnly}
					modes={[
						{ value: "FAMILY", label: "Família" },
						{ value: "GROUP", label: "Grupo" },
					]}
					showWeekday
					showDates={false}
					onChange={(value) => onChange("weekly", value)}
				/>
			</TabsContent>

			<TabsContent value="general" className="mt-0">
				<CleaningTypePanel
					prefix="general"
					title="Limpeza geral"
					description="Modo por grupo, várias datas no ano (sem hora) e setores com vagas."
					config={form.general}
					readOnly={readOnly}
					modes={[{ value: "GROUP", label: "Grupo" }]}
					showWeekday={false}
					showDates
					onChange={(value) => onChange("general", value)}
				/>
			</TabsContent>
		</Tabs>
	);
}
