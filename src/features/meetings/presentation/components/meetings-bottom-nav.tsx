"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
	HiOutlineBuildingOffice2,
	HiOutlineCalendarDays,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";

const SECTIONS = [
	{
		id: "midweek",
		label: "Meio de semana",
		shortLabel: "Meio semana",
		icon: HiOutlineBuildingOffice2,
	},
	{
		id: "weekend",
		label: "Fim de semana",
		shortLabel: "Fim semana",
		icon: HiOutlineCalendarDays,
	},
] as const;

type Props = {
	slug: string;
};

export function MeetingsBottomNav({ slug }: Props) {
	const searchParams = useSearchParams();
	const activeView = searchParams.get("view") ?? "midweek";

	return (
		<nav
			aria-label="Programação das reuniões"
			className={cn(
				"fixed inset-x-0 bottom-0 z-40 border-t border-border",
				"bg-background/95 backdrop-blur-md",
				"pb-[max(0.5rem,env(safe-area-inset-bottom))]",
				"md:hidden",
			)}
		>
			<ul className="mx-auto grid max-w-lg grid-cols-2 gap-1 px-2 pt-1">
				{SECTIONS.map((section) => {
					const params = new URLSearchParams(searchParams.toString());
					params.set("view", section.id);
					const href = `/org/${slug}/meetings?${params.toString()}`;
					const active = activeView === section.id;
					const Icon = section.icon;

					return (
						<li key={section.id}>
							<Link
								href={href}
								aria-current={active ? "page" : undefined}
								className={cn(
									"flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-4xl px-1 py-2",
									"text-[11px] font-medium leading-none transition-colors",
									"focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
									active
										? "bg-primary/10 text-primary"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
								)}
							>
								<Icon
									aria-hidden
									className={cn("h-5 w-5", active ? "text-primary" : "")}
								/>
								<span>{section.shortLabel}</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
