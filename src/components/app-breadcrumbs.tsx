"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type AppBreadcrumbsProps = {
	labelMap?: Record<string, string>;
	hrefLabelMap?: Record<string, string>;
};

function defaultTitle(segment: string) {
	return decodeURIComponent(segment)
		.replace(/-/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function AppBreadcrumbs({
	labelMap = {},
	hrefLabelMap = {},
}: AppBreadcrumbsProps) {
	const pathname = usePathname();

	const segments = pathname.split("/").filter(Boolean);

	const items = segments.map((segment, index) => {
		const href = `/${segments.slice(0, index + 1).join("/")}`;
		const label =
			hrefLabelMap[href] ?? labelMap[segment] ?? defaultTitle(segment);

		return {
			href,
			label,
			isLast: index === segments.length - 1,
		};
	});

	return (
		<nav
			aria-label="Breadcrumb"
			className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
		>
			<Link
				href="/"
				className="inline-flex items-center gap-1 rounded-md hover:text-foreground"
			>
				<Home className="h-4 w-4" />
				<span>Início</span>
			</Link>

			{items.map((item) => (
				<div key={item.href} className="inline-flex items-center gap-2">
					<ChevronRight className="h-4 w-4" />
					{item.isLast ? (
						<span className="font-medium text-foreground">{item.label}</span>
					) : (
						<Link href={item.href} className="rounded-md hover:text-foreground">
							{item.label}
						</Link>
					)}
				</div>
			))}
		</nav>
	);
}
