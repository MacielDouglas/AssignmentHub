"use client";

import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
	weekLabel: string;
	onPrev: () => void;
	onNext: () => void;
	loading: boolean;
	hasPrev: boolean;
	hasNext: boolean;
};

export function MwbWeekHeader({
	weekLabel,
	onPrev,
	onNext,
	loading,
	hasPrev,
	hasNext,
}: Props) {
	return (
		<div className="flex items-center gap-2">
			<Button
				variant="outline"
				size="icon"
				className="h-8 w-8 shrink-0"
				disabled={loading || !hasPrev}
				onClick={onPrev}
				aria-label="Semana anterior"
			>
				<HiOutlineChevronLeft className="h-4 w-4" />
			</Button>

			<div className="min-w-0 flex-1 text-center">
				{loading ? (
					<Skeleton className="mx-auto h-5 w-48" />
				) : (
					<span className="text-label font-medium text-foreground">
						{weekLabel}
					</span>
				)}
			</div>

			<Button
				variant="outline"
				size="icon"
				className="h-8 w-8 shrink-0"
				disabled={loading || !hasNext}
				onClick={onNext}
				aria-label="Próxima semana"
			>
				<HiOutlineChevronRight className="h-4 w-4" />
			</Button>
		</div>
	);
}
