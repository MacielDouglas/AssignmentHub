"use client";

import { useActionState } from "react";
import { linkGoogleUserToPersonAction } from "@/features/people/actions/link-google-user-to-person-action";

type PendingUser = {
	id: string;
	email: string;
	name: string;
	systemRole: string;
};

type PersonListItem = {
	id: string;
	name: string;
};

const initialState = {
	success: false,
	message: "",
};

export function LinkUserToPersonForm(props: {
	slug: string;
	organizationId: string;
	pendingUsers: PendingUser[];
	people: PersonListItem[];
}) {
	const [state, action, pending] = useActionState(
		linkGoogleUserToPersonAction,
		initialState,
	);

	return (
		<form action={action} className="space-y-4">
			<input type="hidden" name="slug" value={props.slug} />

			<div className="space-y-2">
				<label htmlFor="userId" className="text-sm font-medium">
					Usuário pendente
				</label>
				<select
					id="userId"
					name="userId"
					className="w-full rounded-md border px-3 py-2"
					defaultValue=""
				>
					<option value="" disabled>
						Selecione um usuário
					</option>
					{props.pendingUsers.map((user) => (
						<option key={user.id} value={user.id}>
							{user.email} ({user.name})
						</option>
					))}
				</select>
			</div>

			<div className="space-y-2">
				<label htmlFor="personId" className="text-sm font-medium">
					Pessoa
				</label>
				<select
					id="personId"
					name="personId"
					className="w-full rounded-md border px-3 py-2"
					defaultValue=""
				>
					<option value="" disabled>
						Selecione uma pessoa
					</option>
					{props.people.map((person) => (
						<option key={person.id} value={person.id}>
							{person.name}
						</option>
					))}
				</select>
			</div>

			<div className="space-y-2">
				<label htmlFor="role" className="text-sm font-medium">
					Papel na organização
				</label>
				<select
					id="role"
					name="role"
					className="w-full rounded-md border px-3 py-2"
					defaultValue="MEMBER"
				>
					<option value="MEMBER">Member</option>
					<option value="ADMIN">Admin</option>
					<option value="OWNER">Owner</option>
				</select>
			</div>

			{state.message ? (
				<p
					className={`text-sm ${state.success ? "text-green-600" : "text-red-600"}`}
				>
					{state.message}
				</p>
			) : null}

			<button
				type="submit"
				disabled={pending}
				className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
			>
				{pending ? "Vinculando..." : "Vincular usuário à pessoa"}
			</button>
		</form>
	);
}
