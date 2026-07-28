import {
	HiOutlineCalendarDays,
	HiOutlineClipboardDocument,
	HiOutlineSparkles,
} from "react-icons/hi2";

export const SETTINGS_SECTIONS = [
	{
		id: "meetings",
		label: "Reuniões",
		shortLabel: "Reuniões",
		description: "Horários semanais e eventos especiais",
		icon: HiOutlineCalendarDays,
	},
	{
		id: "cleaning",
		label: "Limpeza",
		shortLabel: "Limpeza",
		description: "Tipos de limpeza e setores",
		icon: HiOutlineSparkles,
	},
	{
		id: "assignments",
		label: "Designações",
		shortLabel: "Designações",
		description: "Atribuição de tarefas em breve",
		icon: HiOutlineClipboardDocument,
	},
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]["id"];

export function settingsBasePath(slug: string): string {
	return `/org/${slug}/settings`;
}

export function settingsTabPath(slug: string, tab: string): string {
	return `${settingsBasePath(slug)}?tab=${tab}`;
}

export function isSettingsTab(
	value: string,
): value is "meetings" | "cleaning" | "assignments" {
	return (
		value === "meetings" || value === "cleaning" || value === "assignments"
	);
}
