"use client";

import { CalendarClock, RotateCcw, Save } from "lucide-react";
import { useActionState, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { saveScheduleSettingsAction } from "../actions/save-schedule-settings.action";
import {
	initialSaveScheduleSettingsState,
	type SaveScheduleSettingsState,
	type ScheduleItemFormState,
	type ScheduleSettingsFormState,
} from "../domain/schedule-settings.types";
import type {
	ScheduleType,
	ScheduleVariant,
} from "../schemas/save-schedule-settings.schema";
import { ScheduleSettingsTabs } from "./schedule-settings-tabs";

type Props = {
	initialState: ScheduleSettingsFormState;
	organizationSlug: string;
};

function sanitizeText(input: string): string {
	return input.replace(/</g, "").replace(/>/g, "").trim();
}

function cloneItem<T>(value: T): T {
	return structuredClone(value);
}

function matchesIdentity(
	item: ScheduleItemFormState,
	type: ScheduleType,
	variant: ScheduleVariant = "DEFAULT",
) {
	return item.type === type && item.variant === variant;
}

function buildSerializablePayload(formState: ScheduleSettingsFormState) {
	return {
		organizationId: formState.organizationId,
		items: formState.items.map((item) => ({
			id: item.id,
			type: item.type,
			variant: item.variant,
			effectiveFromYear: item.effectiveFromYear,
			mode: item.mode,
			title: sanitizeText(item.title),
			description: sanitizeText(item.description) || null,
			isActive: item.isActive,
			weeklyRules: item.weeklyRules.map((rule, sortOrder) => ({
				id: rule.id,
				weekday: rule.weekday,
				time: rule.time,
				sortOrder,
			})),
			occurrences: item.occurrences.map((occurrence, sortOrder) => ({
				id: occurrence.id,
				startDate: occurrence.startDate,
				endDate: occurrence.endDate || null,
				time: occurrence.time || null,
				isAllDay: occurrence.isAllDay,
				leaderPersonId: sanitizeText(occurrence.leaderPersonId) || "",
				location: sanitizeText(occurrence.location) || null,
				notes: sanitizeText(occurrence.notes) || null,
				sortOrder,
			})),
		})),
	};
}

function SaveActions({
	pending,
	onReset,
}: {
	pending: boolean;
	onReset: () => void;
}) {
	return (
		<div className="flex flex-col gap-2 sm:flex-row">
			<Button
				type="button"
				variant="outline"
				onClick={onReset}
				disabled={pending}
				className="h-11 rounded-2xl"
			>
				<RotateCcw className="mr-2 size-4" />
				Restaurar padrão
			</Button>

			<Button
				type="submit"
				disabled={pending}
				className="h-11 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8]"
			>
				<Save className="mr-2 size-4" />
				{pending ? "Salvando..." : "Salvar alterações"}
			</Button>
		</div>
	);
}

export function ScheduleSettingsForm({
	initialState,
	organizationSlug,
}: Props) {
	const [state, formAction, pending] = useActionState<
		SaveScheduleSettingsState,
		FormData
	>(saveScheduleSettingsAction, initialSaveScheduleSettingsState);

	const [formState, setFormState] =
		useState<ScheduleSettingsFormState>(initialState);

	const formRef = useRef<HTMLFormElement>(null);

	const defaults = useMemo(
		() => initialState.defaults,
		[initialState.defaults],
	);

	const serializedPayload = useMemo(
		() => JSON.stringify(buildSerializablePayload(formState)),
		[formState],
	);

	function getDefaultByIdentity(
		type: ScheduleType,
		variant: ScheduleVariant = "DEFAULT",
	) {
		return defaults.find((item) => matchesIdentity(item, type, variant));
	}

	function updateItem(
		type: ScheduleType,
		variant: ScheduleVariant,
		value: ScheduleItemFormState,
	) {
		setFormState((current) => {
			const nextItems = [...current.items];
			const index = nextItems.findIndex((item) =>
				matchesIdentity(item, type, variant),
			);

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

	function addNextYearMeeting() {
		setFormState((current) => {
			const existing = current.items.find((item) =>
				matchesIdentity(item, "MEETINGS", "NEXT_YEAR"),
			);

			if (existing) {
				return current;
			}

			const fallback =
				getDefaultByIdentity("MEETINGS", "NEXT_YEAR") ??
				getDefaultByIdentity("MEETINGS", "DEFAULT");

			if (!fallback) {
				return current;
			}

			const currentYear = new Date().getFullYear();

			const nextMeeting = cloneItem({
				...fallback,
				id: undefined,
				clientKey: `meetings-next-year-${crypto.randomUUID()}`,
				variant: "NEXT_YEAR" as const,
				effectiveFromYear: currentYear + 1,
				title: "Reuniões do próximo ano",
				description:
					"Agenda semanal opcional com vigência a partir de 01/01 do ano informado.",
				occurrences: [],
				weeklyRules: fallback.weeklyRules.map((rule, index) => ({
					...rule,
					id: undefined,
					sortOrder: index,
				})),
			});

			const currentMeetingIndex = current.items.findIndex((item) =>
				matchesIdentity(item, "MEETINGS", "DEFAULT"),
			);

			const nextItems = [...current.items];

			if (currentMeetingIndex >= 0) {
				nextItems.splice(currentMeetingIndex + 1, 0, nextMeeting);
			} else {
				nextItems.unshift(nextMeeting);
			}

			return {
				...current,
				items: nextItems,
			};
		});
	}

	function removeNextYearMeeting() {
		setFormState((current) => {
			const nextItems = current.items.filter(
				(item) => !matchesIdentity(item, "MEETINGS", "NEXT_YEAR"),
			);

			return {
				...current,
				items: nextItems,
			};
		});
	}

	function resetItem(type: ScheduleType, variant: ScheduleVariant = "DEFAULT") {
		const fallback = getDefaultByIdentity(type, variant);

		if (!fallback) {
			return;
		}

		updateItem(type, variant, cloneItem(fallback));
	}

	function resetWholeForm() {
		setFormState((current) => ({
			...current,
			items: defaults
				.filter((item) => item.variant !== "NEXT_YEAR")
				.map((item) => cloneItem(item)),
		}));
	}

	function submitForm() {
		formRef.current?.requestSubmit();
	}

	const formErrors = state.errors;
	const globalErrors = formErrors._form ?? [];

	return (
		<>
			<form
				ref={formRef}
				action={formAction}
				className="space-y-5 rounded-[28px] border border-border/60 bg-card p-4 shadow-sm sm:p-6"
			>
				<input type="hidden" name="schedulePayload" value={serializedPayload} />
				<input type="hidden" name="organizationSlug" value={organizationSlug} />

				<section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="space-y-2">
						<div className="inline-flex items-center gap-2 rounded-full bg-[#2563EB]/10 px-3 py-1 text-xs font-medium text-[#2563EB]">
							<CalendarClock className="size-3.5" />
							Agenda central
						</div>

						<div className="space-y-1">
							<h2 className="text-xl font-semibold tracking-tight text-foreground">
								Reuniões, limpezas e eventos
							</h2>
							<p className="max-w-2xl text-sm leading-6 text-muted-foreground">
								Atualize a agenda da organização em um único fluxo, com
								navegação clara e edição direta.
							</p>
						</div>
					</div>

					<SaveActions pending={pending} onReset={resetWholeForm} />
				</section>

				<ScheduleSettingsTabs
					items={formState.items}
					pending={pending}
					onSubmitSection={submitForm}
					onItemChange={(type, variant, value) =>
						updateItem(type, variant, value)
					}
					onAddNextYearMeeting={addNextYearMeeting}
					onRemoveNextYearMeeting={removeNextYearMeeting}
					onResetItem={(type, variant) => resetItem(type, variant)}
					leaders={formState.leaders}
				/>

				{state.message ? (
					<div
						className={`rounded-2xl border px-4 py-3 text-sm ${
							state.success
								? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
								: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
						}`}
					>
						<p>{state.message}</p>

						{(() => {
							const entries = Object.entries(formErrors);

							if (entries.length === 0 && globalErrors.length === 0) {
								return null;
							}

							return (
								<ul className="mt-2 list-disc space-y-1 pl-5">
									{entries.flatMap(([field, messages]) =>
										messages.map((msg) => {
											const fieldLabel = field === "_form" ? "" : `${field}: `;
											const key = `${field}:${msg}`;

											return (
												<li key={key}>
													{fieldLabel}
													{msg}
												</li>
											);
										}),
									)}
								</ul>
							);
						})()}
					</div>
				) : null}
			</form>

			<div className="sticky bottom-3 z-30 mt-4">
				<div className="rounded-3xl border border-border/70 bg-background/95 p-3 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/80">
					<div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={resetWholeForm}
							disabled={pending}
							className="h-11 rounded-2xl"
						>
							<RotateCcw className="mr-2 size-4" />
							Restaurar padrão
						</Button>

						<Button
							type="button"
							onClick={submitForm}
							disabled={pending}
							className="h-11 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8]"
						>
							<Save className="mr-2 size-4" />
							{pending ? "Salvando..." : "Salvar alterações"}
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}
