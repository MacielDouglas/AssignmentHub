"use client";

import { useState } from "react";
import {
	HiEllipsisHorizontal,
	HiOutlineArrowPathRoundedSquare,
	HiOutlineTrash,
} from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ChangeFamilyHeadDialog } from "@/features/people/components/change-family-head-dialog";
import { DeletePersonDialog } from "@/features/people/components/delete-person-dialog";

type PersonActionsMenuProps = {
	slug: string;
	canManage: boolean;
	person: {
		id: string;
		name: string;
		headedFamily: { id: string; name: string } | null;
		user: { id: string } | null;
	};
	familyMembers: { id: string; name: string }[];
	editTrigger: React.ReactNode;
};

export function PersonActionsMenu({
	slug,
	canManage,
	person,
	familyMembers,
	editTrigger,
}: PersonActionsMenuProps) {
	const [openDelete, setOpenDelete] = useState(false);
	const [openHead, setOpenHead] = useState(false);

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
					{person.headedFamily ? (
						<>
							<DropdownMenuItem onClick={() => setOpenHead(true)}>
								<HiOutlineArrowPathRoundedSquare className="mr-2 h-4 w-4" />
								Alterar chefia
							</DropdownMenuItem>
							<DropdownMenuSeparator />
						</>
					) : null}

					<DropdownMenuItem
						onClick={() => setOpenDelete(true)}
						className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
					>
						<HiOutlineTrash className="mr-2 h-4 w-4" />
						Excluir pessoa
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<ChangeFamilyHeadDialog
				open={openHead}
				onOpenChange={setOpenHead}
				slug={slug}
				personId={person.id}
				personName={person.name}
				familyName={person.headedFamily?.name ?? ""}
				members={familyMembers.filter((member) => member.id !== person.id)}
			/>

			<DeletePersonDialog
				open={openDelete}
				onOpenChange={setOpenDelete}
				slug={slug}
				personId={person.id}
				personName={person.name}
				isHead={Boolean(person.headedFamily)}
				hasUser={Boolean(person.user)}
			/>
		</div>
	);
}
