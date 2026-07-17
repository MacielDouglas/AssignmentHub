"use client";

import { useState } from "react";
import { HiOutlinePencilSquare, HiOutlinePlus } from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type {
	FamilyOption,
	PersonListItem,
	PersonOption,
} from "../lib/people-view";
import PersonFormContent from "./person-form-content";

type PersonFormDialogProps = {
	slug: string;
	mode: "create" | "edit";
	families: FamilyOption[];
	peopleOptions: PersonOption[];
	person?: PersonListItem;
	trigger?: React.ReactNode;
};

export function PersonFormDialog({
	slug,
	mode,
	families,
	person,
	trigger,
}: PersonFormDialogProps) {
	const [open, setOpen] = useState(false);
	const [formKey, setFormKey] = useState(0);

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (next) setFormKey((current) => current + 1);
			}}
		>
			<DialogTrigger asChild>
				{trigger ?? (
					<Button className="h-12 rounded-2xl bg-linear-to-r from-blue-600 to-violet-600 px-4 text-white shadow-lg shadow-blue-600/20">
						{mode === "create" ? (
							<HiOutlinePlus className="mr-2 h-4 w-4" />
						) : (
							<HiOutlinePencilSquare className="mr-2 h-4 w-4" />
						)}
						{mode === "create" ? "Nova pessoa" : "Editar"}
					</Button>
				)}
			</DialogTrigger>

			<DialogContent
				className="
    fixed left-1/2 top-1/2
    flex h-[94dvh] max-h-[94dvh]
    w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)]
    -translate-x-1/2 -translate-y-1/2
    flex-col overflow-hidden
    rounded-[28px] border-0 bg-slate-50 p-0 shadow-2xl
    dark:bg-slate-950
    sm:w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)]
    lg:w-[min(1200px,calc(100vw-3rem))] lg:max-w-[min(1200px,calc(100vw-3rem))]
  "
			>
				<PersonFormContent
					key={formKey}
					formKey={formKey}
					slug={slug}
					mode={mode}
					families={families}
					person={person}
					onCancel={() => setOpen(false)}
					onSuccess={() => {
						setOpen(false);
						setFormKey((current) => current + 1);
					}}
				/>
			</DialogContent>
		</Dialog>
	);
}
