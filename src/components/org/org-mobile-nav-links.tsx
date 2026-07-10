"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	HiOutlineCalendarDays,
	HiOutlineCheckBadge,
	HiOutlineClipboardDocumentList,
	HiOutlineSquares2X2,
	HiOutlineUsers,
} from "react-icons/hi2";

import { SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type OrgNavIconName =
	| "dashboard"
	| "tasks"
	| "meetings"
	| "assignments"
	| "people";

type NavItem = {
	href: string;
	label: string;
	iconName: OrgNavIconName;
};

type OrgMobileNavLinksProps = {
	currentSlug: string;
	items: NavItem[];
};

const iconMap = {
	dashboard: HiOutlineSquares2X2,
	tasks: HiOutlineClipboardDocumentList,
	meetings: HiOutlineCalendarDays,
	assignments: HiOutlineCheckBadge,
	people: HiOutlineUsers,
} as const;

export function OrgMobileNavLinks({
	currentSlug,
	items,
}: OrgMobileNavLinksProps) {
	const pathname = usePathname();

	return (
		<ul className="space-y-1">
			{items.map((item) => {
				const href = `/org/${currentSlug}${item.href}`;
				const isActive = pathname === href;
				const Icon = iconMap[item.iconName];

				return (
					<li key={item.label}>
						<SheetClose>
							<Link
								href={href}
								className={cn(
									"flex items-center gap-3 border px-3 py-3 text-sm font-medium transition-colors",
									isActive
										? "border-blue-100 bg-blue-50 text-blue-700"
										: "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground",
								)}
							>
								<Icon className="h-5 w-5" aria-hidden="true" />
								{item.label}
							</Link>
						</SheetClose>
					</li>
				);
			})}
		</ul>
	);
}
