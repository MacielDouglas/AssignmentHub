import {
	HiOutlineCalendarDays,
	HiOutlineCheckBadge,
	HiOutlineClipboardDocumentList,
	HiOutlineSquares2X2,
	HiOutlineUsers,
} from "react-icons/hi2";

import { OrgNavLinks } from "./org-nav-links";

type OrgSidebarProps = {
	currentSlug: string;
	organizationName: string;
};

const navItems = [
	{
		href: "",
		label: "Visão geral",
		icon: HiOutlineSquares2X2,
	},
	{
		href: "/tasks",
		label: "Tarefas",
		icon: HiOutlineClipboardDocumentList,
	},
	{
		href: "/meetings",
		label: "Reuniões",
		icon: HiOutlineCalendarDays,
	},
	{
		href: "/assignments",
		label: "Designações",
		icon: HiOutlineCheckBadge,
	},
	{
		href: "/people",
		label: "Pessoas",
		icon: HiOutlineUsers,
	},
];

export function OrgSidebar({ currentSlug, organizationName }: OrgSidebarProps) {
	return (
		<aside className="hidden border-r border-border bg-card lg:flex lg:flex-col">
			<div className="border-b border-border px-6 py-5">
				<div className="flex items-center gap-3">
					<div className="flex h-11 w-11 items-center justify-center rounded-none bg-linear-to-br from-blue-600 to-violet-600 text-white shadow-sm">
						<HiOutlineSquares2X2 className="h-5 w-5" aria-hidden="true" />
					</div>

					<div className="min-w-0">
						<p className="truncate text-sm font-semibold text-foreground">
							AssignmentHub
						</p>
						<p className="truncate text-xs text-muted-foreground">
							{organizationName}
						</p>
					</div>
				</div>
			</div>

			<nav className="flex-1 px-4 py-4" aria-label="Navegação da organização">
				<OrgNavLinks currentSlug={currentSlug} items={navItems} />
			</nav>
		</aside>
	);
}
