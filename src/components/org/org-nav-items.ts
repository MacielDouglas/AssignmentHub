import type { LucideIcon } from "lucide-react";
import {
	BrushCleaning,
	FolderKanban,
	Home,
	NotebookPen,
	ScrollText,
	Settings,
	Users,
	UsersRound,
} from "lucide-react";

export type OrgNavItem = {
	href: string;
	label: string;
	icon: LucideIcon;
	exact?: boolean;
};

export function getOrgNavItems(slug: string): OrgNavItem[] {
	return [
		{
			href: `/org/${slug}`,
			label: "Visão geral",
			icon: Home,
			exact: true,
		},
		{
			href: `/org/${slug}/people`,
			label: "Pessoas",
			icon: Users,
		},
		{
			href: `/org/${slug}/groups`,
			label: "Grupos",
			icon: FolderKanban,
		},
		{
			href: `/org/${slug}/meeting-content`,
			label: "Conteúdo das Reuniões",
			icon: NotebookPen,
		},
		{
			href: `/org/${slug}/families`,
			label: "Famílias",
			icon: UsersRound,
		},
		{
			href: `/org/${slug}/cleaning`,
			label: "Designação Limpeza",
			icon: BrushCleaning,
		},
		{
			href: `/org/${slug}/outlines`,
			label: "Discursos",
			icon: ScrollText,
		},
		{
			href: `/org/${slug}/settings`,
			label: "Configurações",
			icon: Settings,
		},
	];
}
