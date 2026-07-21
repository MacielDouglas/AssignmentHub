"use client";

import { useCallback, useState } from "react";
import { HiOutlinePlus } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { CleaningSectorRow } from "@/features/settings/cleaning/components/cleaning-sector-row";
import type { CleaningTypeView } from "@/features/settings/cleaning/lib/cleaning-settings";
import type { CleaningAssignmentMode } from "@/generated/prisma/client";

type Props = {
	organizationSlug: string;
	canEdit: boolean;
	typeView: CleaningTypeView;
	assignmentMode: CleaningAssignmentMode;
};

function sectorDataKey(sector: {
	id: string;
	name: string;
	description: string | null;
	peopleRequired: number | null;
	allowYoung: boolean;
	targetSex: string | null;
	isActive: boolean;
	sortOrder: number;
}) {
	return [
		sector.id,
		sector.name,
		sector.description ?? "",
		sector.peopleRequired ?? "",
		sector.allowYoung,
		sector.targetSex ?? "",
		sector.isActive,
		sector.sortOrder,
	].join("::");
}

export function CleaningSectorsEditor({
	organizationSlug,
	canEdit,
	typeView,
	assignmentMode,
}: Props) {
	const [adding, setAdding] = useState(false);
	const showPersonFields =
		typeView.type === "MEETING" && assignmentMode === "PERSON";

	const handleCancelNew = useCallback(() => {
		setAdding(false);
	}, []);

	return (
		<div className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
			<div className="flex items-center justify-between gap-3">
				<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
					Setores
				</h3>
				{canEdit ? (
					<Button
						type="button"
						variant="outline"
						className="h-9 rounded-2xl"
						onClick={() => setAdding(true)}
					>
						<HiOutlinePlus className="mr-1 h-4 w-4" />
						Novo setor
					</Button>
				) : null}
			</div>

			<ul className="space-y-3">
				{typeView.sectors.map((sector) => (
					<CleaningSectorRow
						key={sectorDataKey(sector)}
						organizationSlug={organizationSlug}
						canEdit={canEdit}
						type={typeView.type}
						sector={sector}
						showPersonFields={showPersonFields}
					/>
				))}

				{adding ? (
					<CleaningSectorRow
						key="new-sector"
						organizationSlug={organizationSlug}
						canEdit={canEdit}
						type={typeView.type}
						sector={null}
						showPersonFields={showPersonFields}
						onCancelNew={handleCancelNew}
					/>
				) : null}
			</ul>

			{typeView.sectors.length === 0 && !adding ? (
				<p className="text-sm text-slate-500">Nenhum setor cadastrado.</p>
			) : null}
		</div>
	);
}
