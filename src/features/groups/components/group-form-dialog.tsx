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
			<Button className="h-11 rounded-4xl bg-primary px-4 text-primary-foreground shadow-md">
				<HiOutlinePlus className="mr-2 h-4 w-4" />
				Novo grupo
			</Button>
		) : (
			<Button variant="outline" className="h-11 rounded-4xl border-border">
				<HiOutlinePencilSquare className="mr-2 h-4 w-4" />
				Editar
			</Button>
		);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
			<DialogContent className="flex h-[94dvh] max-h-[94dvh] w-[min(96vw,56rem)] max-w-none flex-col gap-0 overflow-hidden rounded-4xl border-border p-0 sm:h-auto sm:max-h-[90vh]">
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
