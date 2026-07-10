"use client";

import Link from "next/link";
import {
	HiOutlineBars3,
	HiOutlineCalendarDays,
	HiOutlineCheckBadge,
	HiOutlineClipboardDocumentList,
	HiOutlineSquares2X2,
	HiOutlineUsers,
} from "react-icons/hi2";

import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

type OrgMobileDrawerProps = {
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

export function OrgMobileDrawer({
	currentSlug,
	organizationName,
}: OrgMobileDrawerProps) {
	return (
		<div className="lg:hidden">
			<Sheet>
				<SheetTrigger>
					<button
						type="button"
						className="inline-flex h-11 w-11 items-center justify-center rounded-none border border-border bg-background text-foreground hover:bg-muted"
						aria-label="Abrir menu"
					>
						<HiOutlineBars3 className="h-5 w-5" aria-hidden="true" />
					</button>
				</SheetTrigger>

				<SheetContent side="left" className="w-75 rounded-none p-0">
					<SheetHeader className="border-b border-border px-5 py-4 text-left">
						<SheetTitle className="text-left text-base font-semibold">
							{organizationName}
						</SheetTitle>
					</SheetHeader>

					<nav className="px-3 py-4" aria-label="Menu mobile da organização">
						<ul className="space-y-1">
							{navItems.map((item) => {
								const Icon = item.icon;
								const href = `/org/${currentSlug}${item.href}`;

								return (
									<li key={item.label}>
										<SheetClose>
											<Link
												href={href}
												className="flex items-center gap-3 border border-transparent px-3 py-3 text-sm font-medium text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
											>
												<Icon className="h-5 w-5" aria-hidden="true" />
												{item.label}
											</Link>
										</SheetClose>
									</li>
								);
							})}
						</ul>
					</nav>
				</SheetContent>
			</Sheet>
		</div>
	);
}
