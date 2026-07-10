"use client";

import { HiOutlineBars3 } from "react-icons/hi2";

import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { OrgMobileNavLinks } from "./org-mobile-nav-links";

type OrgMobileDrawerProps = {
	currentSlug: string;
	organizationName: string;
};

const navItems = [
	{ href: "", label: "Visão geral", iconName: "dashboard" },
	{ href: "/tasks", label: "Tarefas", iconName: "tasks" },
	{ href: "/meetings", label: "Reuniões", iconName: "meetings" },
	{ href: "/assignments", label: "Designações", iconName: "assignments" },
	{ href: "/people", label: "Pessoas", iconName: "people" },
] as const;

export function OrgMobileDrawer({
	currentSlug,
	organizationName,
}: OrgMobileDrawerProps) {
	return (
		<div className="lg:hidden">
			<Sheet>
				<SheetTrigger className="inline-flex h-11 w-11 items-center justify-center rounded-none border border-border bg-background text-foreground hover:bg-muted">
					<span className="sr-only">Abrir menu</span>
					<HiOutlineBars3 className="h-5 w-5" aria-hidden="true" />
				</SheetTrigger>

				<SheetContent side="left" className="w-75 rounded-none p-0">
					<SheetHeader className="border-b border-border px-5 py-4 text-left">
						<SheetTitle className="text-left text-base font-semibold">
							{organizationName}
						</SheetTitle>
					</SheetHeader>

					<nav className="px-3 py-4" aria-label="Menu mobile da organização">
						<OrgMobileNavLinks
							currentSlug={currentSlug}
							items={[...navItems]}
						/>
					</nav>
				</SheetContent>
			</Sheet>
		</div>
	);
}
