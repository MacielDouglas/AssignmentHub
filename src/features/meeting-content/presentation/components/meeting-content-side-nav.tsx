"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	HiOutlineBookOpen,
	HiOutlineCalendarDays,
	HiOutlineMicrophone,
	HiOutlineMusicalNote,
} from "react-icons/hi2";

import { cn } from "@/lib/utils";

import {
	MEETING_CONTENT_SECTIONS,
	type MeetingContentSectionId,
	meetingContentSectionPath,
} from "../nav/meeting-content-nav";

const ICONS: Record<
	MeetingContentSectionId,
	React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
	apostila: HiOutlineCalendarDays,
	sentinela: HiOutlineBookOpen,
	canticos: HiOutlineMusicalNote,
	discursos: HiOutlineMicrophone,
};

type Props = {
	slug: string;
};

export function MeetingContentSideNav({ slug }: Props) {
	const pathname = usePathname();

	return (
		<nav
			aria-label="Seções do conteúdo das reuniões"
			className="hidden md:block"
		>
			<ul className="space-y-1">
				{MEETING_CONTENT_SECTIONS.map((section) => {
					const href = meetingContentSectionPath(slug, section.href);
					const active = pathname === href || pathname.startsWith(`${href}/`);
					const Icon = ICONS[section.id];

					return (
						<li key={section.id}>
							<Link
								href={href}
								aria-current={active ? "page" : undefined}
								className={cn(
									"flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
									active
										? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
										: "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900",
								)}
							>
								<Icon aria-hidden className="h-5 w-5 shrink-0" />
								<span className="min-w-0">
									<span className="block">{section.label}</span>
									<span
										className={cn(
											"mt-0.5 block text-xs font-normal",
											active
												? "text-blue-100"
												: "text-slate-400 dark:text-slate-500",
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
