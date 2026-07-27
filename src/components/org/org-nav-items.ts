import type { LucideIcon } from "lucide-react";
import {
	BrushCleaning,
	CalendarDays,
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

type Translate = (key: string) => string;

export function getOrgNavItems(slug: string, t: Translate): OrgNavItem[] {
	return [
		{
			href: `/org/${slug}`,
			label: t("overview"),
			icon: Home,
			exact: true,
		},
		{
			href: `/org/${slug}/meetings`,
			label: t("meetings"),
			icon: CalendarDays,
		},
		{
			href: `/org/${slug}/people`,
			label: t("people"),
			icon: Users,
		},
		{
			href: `/org/${slug}/groups`,
			label: t("groups"),
			icon: FolderKanban,
		},
		{
			href: `/org/${slug}/meeting-content`,
			label: t("meetingContent"),
			icon: NotebookPen,
		},
		{
			href: `/org/${slug}/families`,
			label: t("families"),
			icon: UsersRound,
		},
		{
			href: `/org/${slug}/cleaning`,
			label: t("cleaning"),
			icon: BrushCleaning,
		},
		{
			href: `/org/${slug}/outlines`,
			label: t("outlines"),
			icon: ScrollText,
		},
		{
			href: `/org/${slug}/settings`,
			label: t("settings"),
			icon: Settings,
		},
	];
}
