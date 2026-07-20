"use client";

import { type ReactNode, useState } from "react";
import { HiOutlinePencilSquare, HiOutlinePlus } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { GroupFormContent } from "@/features/groups/components/group-form-content";
import type {
	GroupListItem,
	GroupSelectablePerson,
} from "@/features/groups/lib/groups-view";

type GroupFormDialogProps = {
	mode: "create" | "edit";
	organizationSlug: string;
	people: GroupSelectablePerson[];
	group?: Pick<
		GroupListItem,
		"id" | "name" | "slug" | "superintendentId" | "assistantId" | "members"
	>;
	trigger?: ReactNode;
};

export function GroupFormDialog({
	mode,
	organizationSlug,
	people,
	group,
	trigger,
}: GroupFormDialogProps) {
	const [open, setOpen] = useState(false);

	const defaultTrigger =
		mode === "create" ? (
			<Button className="h-11 rounded-2xl bg-linear-to-r from-blue-600 to-violet-600 px-4 text-white shadow-lg shadow-blue-600/20 hover:from-blue-600 hover:to-violet-500">
				<HiOutlinePlus className="mr-2 h-4 w-4" />
				Novo grupo
			</Button>
		) : (
			<Button
				variant="outline"
				className="h-11 rounded-2xl border-slate-200 dark:border-slate-800"
			>
				<HiOutlinePencilSquare className="mr-2 h-4 w-4" />
				Editar
			</Button>
		);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
			<DialogContent className="flex h-[94dvh] max-h-[94dvh] w-[min(96vw,56rem)] max-w-none flex-col gap-0 overflow-hidden rounded-[28px] border-slate-200 p-0 dark:border-slate-800 sm:h-auto sm:max-h-[90vh]">
				<GroupFormContent
					mode={mode}
					organizationSlug={organizationSlug}
					people={people}
					group={group}
					onSuccess={() => setOpen(false)}
					onCancel={() => setOpen(false)}
				/>
			</DialogContent>
		</Dialog>
	);
}
