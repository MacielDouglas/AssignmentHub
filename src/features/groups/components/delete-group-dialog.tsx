"use client";

import { useActionState, useEffect } from "react";
import { HiOutlineExclamationTriangle, HiOutlineTrash } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { deleteGroupAction } from "@/features/groups/actions/delete-group-action";
import type { GroupActionState } from "@/features/groups/actions/group-action-state";

type DeleteGroupDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationSlug: string;
	groupId: string;
	groupName: string;
};

const initialState: GroupActionState = {
	success: false,
	message: "",
};

export function DeleteGroupDialog({
	open,
	onOpenChange,
	organizationSlug,
	groupId,
	groupName,
}: DeleteGroupDialogProps) {
	const [state, formAction, pending] = useActionState(
		deleteGroupAction,
		initialState,
	);

	useEffect(() => {
		if (state.success) {
			onOpenChange(false);
		}
	}, [state.success, onOpenChange]);

	const dependencies = state.dependencies ?? [];
	const blocked = dependencies.length > 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md rounded-[28px] border-slate-200 dark:border-slate-800">
				<DialogHeader>
					<div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
						<HiOutlineExclamationTriangle className="h-5 w-5" />
					</div>
					<DialogTitle>Excluir grupo</DialogTitle>
					<DialogDescription>
						Tem certeza de que deseja excluir o grupo{" "}
						<strong className="text-slate-900 dark:text-slate-50">
							{groupName}
						</strong>
						? Os membros serão desvinculados (ficarão sem grupo).
					</DialogDescription>
				</DialogHeader>

				{blocked ? (
					<div className="space-y-2 rounded-[20px] border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
						<p className="text-sm font-medium text-amber-950 dark:text-amber-100">
							Exclusão bloqueada por dependências
						</p>
						<ul className="list-disc space-y-1 pl-5 text-sm text-amber-900 dark:text-amber-200">
							{dependencies.map((dep) => (
								<li key={`${dep.kind}-${dep.label}`}>
									{dep.label}: <strong>{dep.count}</strong>
								</li>
							))}
						</ul>
						<p className="text-xs text-amber-800 dark:text-amber-300">
							Remova ou altere esses vínculos antes de excluir o grupo.
						</p>
					</div>
				) : null}

				{state.message && !state.success ? (
					<p className="text-sm text-red-600 dark:text-red-400">
						{state.message}
					</p>
				) : null}

				<form action={formAction}>
					<input
						type="hidden"
						name="organizationSlug"
						value={organizationSlug}
					/>
					<input type="hidden" name="groupId" value={groupId} />

					<DialogFooter className="mt-2 gap-2 sm:gap-2">
						<Button
							type="button"
							variant="outline"
							className="h-11 rounded-2xl"
							onClick={() => onOpenChange(false)}
							disabled={pending}
						>
							Cancelar
						</Button>
						<Button
							type="submit"
							disabled={pending || blocked}
							className="h-11 rounded-2xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
						>
							<HiOutlineTrash className="mr-2 h-4 w-4" />
							{pending ? "Excluindo..." : "Excluir grupo"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
