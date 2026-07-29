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
		description: "Reunião de meio de semana",
		icon: HiOutlineBuildingOffice2,
	},
	{
		id: "weekend",
		label: "Fim de semana",
		description: "Reunião de fim de semana",
		icon: HiOutlineCalendarDays,
	},
] as const;

type Props = {
	slug: string;
};

export function MeetingsSideNav({ slug }: Props) {
	const searchParams = useSearchParams();
	const activeView = searchParams.get("view") ?? "midweek";

	return (
		<nav aria-label="Programação das reuniões" className="hidden md:block">
			<ul className="space-y-1">
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
									"flex min-h-12 items-center gap-3 rounded-4xl px-3 py-2.5 text-sm font-medium transition-colors",
									"focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
									active
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
								)}
							>
								<Icon aria-hidden className="h-5 w-5 shrink-0" />
								<span className="min-w-0">
									<span className="block">{section.label}</span>
									<span
										className={cn(
											"mt-0.5 block text-xs font-normal",
											active
												? "text-primary-foreground/80"
												: "text-muted-foreground",
										)}
									>
										{section.description}
									</span>
								</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
