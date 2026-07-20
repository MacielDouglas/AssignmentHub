"use client";

import { type ReactNode, useState } from "react";
import { HiEllipsisHorizontal, HiOutlineTrash } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteGroupDialog } from "@/features/groups/components/delete-group-dialog";
import type {
	GroupListItem,
	GroupSelectablePerson,
} from "@/features/groups/lib/groups-view";

type GroupActionsMenuProps = {
	canManage: boolean;
	organizationSlug: string;
	group: Pick<
		GroupListItem,
		"id" | "name" | "slug" | "superintendentId" | "assistantId" | "members"
	>;
	people: GroupSelectablePerson[];
	editTrigger: ReactNode;
};

export function GroupActionsMenu({
	canManage,
	organizationSlug,
	group,
	editTrigger,
}: GroupActionsMenuProps) {
	const [openDelete, setOpenDelete] = useState(false);

	if (!canManage) return null;

	return (
		<div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-56">
			{editTrigger}

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						className="h-11 justify-between rounded-2xl"
					>
						Ações
						<HiEllipsisHorizontal className="h-5 w-5" />
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent align="end" className="w-56 rounded-2xl">
					<DropdownMenuItem
						onClick={() => setOpenDelete(true)}
						className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
					>
						<HiOutlineTrash className="mr-2 h-4 w-4" />
						Excluir grupo
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<DeleteGroupDialog
				open={openDelete}
				onOpenChange={setOpenDelete}
				organizationSlug={organizationSlug}
				groupId={group.id}
				groupName={group.name}
			/>
		</div>
	);
}
