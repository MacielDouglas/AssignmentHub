"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { saveScheduleSettingsAction } from "../actions/save-schedule-settings.action";
import {
	initialSaveScheduleSettingsState,
	type SaveScheduleSettingsState,
	type ScheduleItemFormState,
	type ScheduleSettingsFormState,
} from "../domain/schedule-settings.types";
import type { ScheduleType } from "../schemas/save-schedule-settings.schema";
import { ScheduleSettingsTabs } from "./schedule-settings-tabs";

type Props = {
	initialState: ScheduleSettingsFormState;
};

function cloneItem<T>(value: T): T {
	return structuredClone(value);
}

export function ScheduleSettingsForm({ initialState }: Props) {
	const [state, formAction, pending] = useActionState<
		SaveScheduleSettingsState,
		FormData
	>(saveScheduleSettingsAction, initialSaveScheduleSettingsState);

	const [formState, setFormState] =
		useState<ScheduleSettingsFormState>(initialState);

	const defaults = useMemo(
		() => initialState.defaults,
		[initialState.defaults],
	);

	function getDefaultByType(type: ScheduleType) {
		return defaults.find((item) => item.type === type);
	}

	function updateFirstItemByType(
		type: ScheduleType,
		value: ScheduleItemFormState,
	) {
		setFormState((current) => {
			const nextItems = [...current.items];
			const index = nextItems.findIndex((item) => item.type === type);

			if (index === -1) {
				return current;
			}

			nextItems[index] = value;
			return {
				...current,
				items: nextItems,
			};
		});
	}

	function updateSecondMeeting(value: ScheduleItemFormState) {
		setFormState((current) => {
			const meetings = current.items.filter((item) => item.type === "MEETINGS");
			const nonMeetings = current.items.filter(
				(item) => item.type !== "MEETINGS",
			);

			if (meetings.length < 2) {
				return current;
			}

			const nextMeetings = [meetings[0], value];
			return {
				...current,
				items: [...nextMeetings, ...nonMeetings],
			};
		});
	}

	function addNextYearMeeting() {
		setFormState((current) => {
			const meetings = current.items.filter((item) => item.type === "MEETINGS");

			if (meetings.length > 1) {
				return current;
			}

			const fallback = getDefaultByType("MEETINGS");

			if (!fallback) {
				return current;
			}

			const nextMeeting = cloneItem({
				...fallback,
				id: undefined,
				clientKey: `meetings-next-year-${crypto.randomUUID()}`,
				title: "Reuniões próximo ano",
				description: "Agenda semanal planejada para o próximo ano.",
			});

			const nonMeetings = current.items.filter(
				(item) => item.type !== "MEETINGS",
			);

			return {
				...current,
				items: [meetings[0], nextMeeting, ...nonMeetings],
			};
		});
	}

	function resetItem(type: ScheduleType) {
		const fallback = getDefaultByType(type);

		if (!fallback) {
			return;
		}

		if (type === "MEETINGS") {
			updateFirstItemByType("MEETINGS", cloneItem(fallback));
			return;
		}

		updateFirstItemByType(type, cloneItem(fallback));
	}

	function resetWholeForm() {
		setFormState((current) => ({
			...current,
			items: defaults.map((item) => cloneItem(item)),
		}));
	}

	const formErrors = state.errors;
	const globalErrors = formErrors._form ?? [];

	return (
		<form action={formAction} className="space-y-6">
			<input
				type="hidden"
				name="organizationId"
				value={formState.organizationId}
			/>

			<ScheduleSettingsTabs
				items={formState.items}
				onItemChange={(type, value) => {
					if (type === "MEETINGS") {
						const meetingItems = formState.items.filter(
							(item) => item.type === "MEETINGS",
						);

						if (
							meetingItems.length > 1 &&
							value.title.includes("próximo ano")
						) {
							updateSecondMeeting(value);
							return;
						}
					}

					updateFirstItemByType(type, value);
				}}
				onAddNextYearMeeting={addNextYearMeeting}
				onResetItem={resetItem}
			/>

			{state.message ? (
				<div
					className={`rounded-xl border p-4 text-sm ${
						state.success
							? "border-green-200 bg-green-50 text-green-800"
							: "border-red-200 bg-red-50 text-red-800"
					}`}
				>
					<p>{state.message}</p>

					{globalErrors.length > 0 ? (
						<ul className="mt-2 list-disc space-y-1 pl-5">
							{globalErrors.map((error) => (
								<li key={error}>{error}</li>
							))}
						</ul>
					) : null}
				</div>
			) : null}

			<div className="flex justify-end gap-3">
				<Button
					type="button"
					variant="outline"
					onClick={resetWholeForm}
					disabled={pending}
				>
					Restaurar padrão sugerido
				</Button>

				<Button type="submit" disabled={pending}>
					{pending ? "Salvando..." : "Salvar configurações"}
				</Button>
			</div>
		</form>
	);
}
