"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deletePersonAction } from "@/features/people/actions/delete-person-action";
import type { PersonActionState } from "@/features/people/actions/person-action-state";

const initialState: PersonActionState = {
	success: false,
	message: "",
};

function SubmitDeleteButton({ disabled }: { disabled: boolean }) {
	const { pending } = useFormStatus();

	return (
		<Button
			type="submit"
			variant="destructive"
			disabled={disabled || pending}
			className="h-11 rounded-2xl"
		>
			{pending ? "Excluindo..." : "Excluir pessoa"}
		</Button>
	);
}

export function DeletePersonDialog({
	open,
	onOpenChange,
	slug,
	personId,
	personName,
	isHead,
	hasUser,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	slug: string;
	personId: string;
	personName: string;
	isHead: boolean;
	hasUser: boolean;
}) {
	const [state, formAction] = useActionState(deletePersonAction, initialState);

	useEffect(() => {
		if (state.success) onOpenChange(false);
	}, [state.success, onOpenChange]);

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="rounded-[28px]">
				<AlertDialogHeader>
					<AlertDialogTitle className="text-left">
						Excluir pessoa
					</AlertDialogTitle>
					<AlertDialogDescription className="text-left">
						Esta ação remove <strong>{personName}</strong> permanentemente.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="grid gap-4">
					{isHead ? (
						<Alert className="rounded-2xl border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
							<HiOutlineExclamationTriangle className="h-4 w-4" />
							<AlertTitle>Chefe de família</AlertTitle>
							<AlertDescription>
								Ao excluir essa pessoa, a família será eliminada e todos os
								membros ficarão sem família.
							</AlertDescription>
						</Alert>
					) : null}

					{hasUser ? (
						<Alert className="rounded-2xl border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
							<HiOutlineExclamationTriangle className="h-4 w-4" />
							<AlertTitle>Exclusão bloqueada</AlertTitle>
							<AlertDescription>
								Não é permitido deletar uma pessoa com usuário vinculado.
							</AlertDescription>
						</Alert>
					) : null}

					{state.message ? (
						<p
							className={
								state.success
									? "text-sm text-emerald-600 dark:text-emerald-400"
									: "text-sm text-red-600 dark:text-red-400"
							}
						>
							{state.message}
						</p>
					) : null}

					<form
						action={formAction}
						className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
					>
						<input type="hidden" name="slug" value={slug} />
						<input type="hidden" name="personId" value={personId} />

						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							className="h-11 rounded-2xl"
						>
							Cancelar
						</Button>

						<SubmitDeleteButton disabled={hasUser} />
					</form>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
}
