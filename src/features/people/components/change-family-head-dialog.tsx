"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { changeFamilyHeadAction } from "@/features/people/actions/change-family-head-action";
import type { PersonActionState } from "@/features/people/actions/person-action-state";

const initialState: PersonActionState = {
	success: false,
	message: "",
};

type ChangeFamilyHeadDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	slug: string;
	personId: string;
	personName: string;
	familyName: string;
	members: { id: string; name: string }[];
};

export function ChangeFamilyHeadDialog({
	open,
	onOpenChange,
	slug,
	personId,
	personName,
	familyName,
	members,
}: ChangeFamilyHeadDialogProps) {
	const [state, formAction] = useActionState(
		changeFamilyHeadAction,
		initialState,
	);
	const [decision, setDecision] = useState<"REASSIGN" | "DISSOLVE">("REASSIGN");
	const [newHeadPersonId, setNewHeadPersonId] = useState("");

	useEffect(() => {
		if (state.success) {
			onOpenChange(false);
		}
	}, [state.success, onOpenChange]);

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			setDecision("REASSIGN");
			setNewHeadPersonId("");
		}
		onOpenChange(nextOpen);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto rounded-[28px]">
				<form action={formAction} className="grid gap-6">
					<input type="hidden" name="slug" value={slug} />
					<input type="hidden" name="personId" value={personId} />
					<input type="hidden" name="headRemovalAction" value={decision} />
					<input type="hidden" name="newHeadPersonId" value={newHeadPersonId} />

					<DialogHeader>
						<DialogTitle>Alterar chefia da família</DialogTitle>
						<DialogDescription>
							{personName} é chefe da {familyName}. Escolha se deseja transferir
							a chefia ou eliminar a família.
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-3">
						<Label>Decisão</Label>

						<RadioGroup
							value={decision}
							onValueChange={(value) =>
								setDecision(value as "REASSIGN" | "DISSOLVE")
							}
							className="grid gap-3"
						>
							<Label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
								<RadioGroupItem value="REASSIGN" id="decision-reassign" />
								<div>
									<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
										Designar novo chefe
									</p>
									<p className="text-xs text-slate-500 dark:text-slate-400">
										Escolha outra pessoa da mesma família.
									</p>
								</div>
							</Label>

							<Label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
								<RadioGroupItem value="DISSOLVE" id="decision-dissolve" />
								<div>
									<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
										Eliminar família
									</p>
									<p className="text-xs text-slate-500 dark:text-slate-400">
										Todos os membros ficarão sem família.
									</p>
								</div>
							</Label>
						</RadioGroup>
					</div>

					{decision === "REASSIGN" ? (
						<div className="grid gap-2">
							<Label htmlFor="new-head-person">Novo chefe</Label>
							<Select
								value={newHeadPersonId}
								onValueChange={setNewHeadPersonId}
							>
								<SelectTrigger
									id="new-head-person"
									className="h-11 rounded-2xl"
								>
									<SelectValue placeholder="Selecione uma pessoa" />
								</SelectTrigger>
								<SelectContent>
									{members.map((member) => (
										<SelectItem key={member.id} value={member.id}>
											{member.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
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

					<DialogFooter className="flex-col-reverse gap-3 sm:flex-row">
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
						>
							Cancelar
						</Button>
						<Button
							type="submit"
							className="bg-linear-to-r from-blue-600 to-violet-600 text-white"
						>
							Confirmar
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
