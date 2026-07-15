"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CleaningSettingsStateErrors } from "../domain/cleaning-settings.types";
import type { CleaningSettingsFormState } from "../lib/map-cleaning-settings-form-initial-state";
import { CleaningSettingsTypePanel } from "./cleaning-settings-type-panel";

type ConfigKey = keyof CleaningSettingsFormState["configs"];

type Props = {
	configs: CleaningSettingsFormState["configs"];
	errors?: CleaningSettingsStateErrors;
	onConfigChange: (
		type: ConfigKey,
		value: CleaningSettingsFormState["configs"][ConfigKey],
	) => void;
	onConfigReset: (type: ConfigKey) => void;
};

const TAB_META = {
	MEETING: {
		title: "Limpeza por reunião",
		description:
			"Defina frequência, dias e setores da limpeza feita por reunião.",
	},
	WEEKLY: {
		title: "Limpeza semanal",
		description: "Defina frequência, dias e setores da limpeza semanal.",
	},
	GENERAL: {
		title: "Limpeza geral",
		description:
			"Selecione as datas específicas e os setores da limpeza geral.",
	},
} as const;

export function CleaningSettingsTabs({
	configs,
	errors,
	onConfigChange,
	onConfigReset,
}: Props) {
	const activeTypes = useMemo(
		() =>
			(Object.keys(configs) as ConfigKey[]).filter(
				(type) => configs[type].enabled,
			),
		[configs],
	);

	const [selectedTab, setSelectedTab] = useState<ConfigKey | "">(
		activeTypes[0] ?? "",
	);

	const currentTab =
		selectedTab && activeTypes.includes(selectedTab)
			? selectedTab
			: (activeTypes[0] ?? "");

	if (activeTypes.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
				Ative pelo menos um tipo de limpeza para configurar.
			</div>
		);
	}

	return (
		<Tabs
			value={currentTab}
			onValueChange={(value) => setSelectedTab(value as ConfigKey)}
			className="space-y-4"
		>
			<div className="overflow-x-auto">
				<TabsList className="inline-flex min-w-full justify-start">
					{activeTypes.map((type) => (
						<TabsTrigger key={type} value={type}>
							{TAB_META[type].title}
						</TabsTrigger>
					))}
				</TabsList>
			</div>

			{activeTypes.map((type) => (
				<TabsContent key={type} value={type} className="mt-0">
					<CleaningSettingsTypePanel
						type={type}
						title={TAB_META[type].title}
						description={TAB_META[type].description}
						value={configs[type]}
						errors={errors}
						onChange={(value) => onConfigChange(type, value)}
						onReset={() => onConfigReset(type)}
					/>
				</TabsContent>
			))}
		</Tabs>
	);
}
