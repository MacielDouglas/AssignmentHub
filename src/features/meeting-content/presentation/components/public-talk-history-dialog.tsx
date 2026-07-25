"use client";

import { useActionState, useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { PublicTalksSectionData } from "../../queries/get-public-talks-section-data.query";
import { registerPublicTalkHistoryAction } from "../actions/public-talk.actions";
import { PublicTalkHistoryList } from "./public-talk-history-list";

type TalkHistoryDialogProps = {
	slug: string;
	organizationId: string;
	trigger: React.ReactNode;
	talk: PublicTalksSectionData["talks"][number];
	eligibleSpeakers: PublicTalksSectionData["eligibleSpeakers"];
};

const initialState = {
	success: false,
	error: null,
};

function toDateInputValue(value: Date) {
	const year = value.getFullYear();
	const month = String(value.getMonth() + 1).padStart(2, "0");
	const day = String(value.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

export function PublicTalkHistoryDialog({
	slug,
	organizationId,
	trigger,
	talk,
	eligibleSpeakers,
}: TalkHistoryDialogProps) {
	const [open, setOpen] = useState(false);
	const [speakerType, setSpeakerType] = useState<"PERSON" | "SUB_PERSON">(
		"PERSON",
	);
	const [state, formAction, pending] = useActionState(
		registerPublicTalkHistoryAction,
		initialState,
	);

	const personSpeakers = useMemo(
		() => eligibleSpeakers.filter((item) => item.kind === "PERSON"),
		[eligibleSpeakers],
	);

	const subPersonSpeakers = useMemo(
		() => eligibleSpeakers.filter((item) => item.kind === "SUB_PERSON"),
		[eligibleSpeakers],
	);

	// useEffect(() => {
	// 	if (!state.success) {
	// 		return;
	// 	}

	// 	setOpen(false);
	// }, [state.success]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>

			<DialogContent className="max-w-3xl rounded-[28px] p-0">
				<DialogHeader className="border-b border-slate-200 px-5 py-4 text-left dark:border-slate-800">
					<DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
						Histórico · Nº {talk.number} · {talk.title}
					</DialogTitle>
				</DialogHeader>

				<div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
					<div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800 lg:border-b-0 lg:border-r">
						<PublicTalkHistoryList history={talk.latestHistory} />
					</div>

					<form action={formAction} className="space-y-4 px-5 py-5">
						<input type="hidden" name="slug" value={slug} />
						<input type="hidden" name="organizationId" value={organizationId} />
						<input type="hidden" name="publicTalkId" value={talk.id} />

						<div className="space-y-2">
							<Label htmlFor={`performedAt-${talk.id}`}>Data</Label>
							<input
								id={`performedAt-${talk.id}`}
								type="date"
								name="performedAt"
								defaultValue={toDateInputValue(new Date())}
								disabled={pending}
								className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
							/>
						</div>

						<fieldset className="space-y-2">
							<legend className="text-sm font-medium text-slate-900 dark:text-slate-100">
								Tipo de orador
							</legend>

							<div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
								<button
									type="button"
									onClick={() => setSpeakerType("PERSON")}
									className={[
										"min-h-10 rounded-xl px-4 text-sm font-medium transition",
										speakerType === "PERSON"
											? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
											: "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
									].join(" ")}
								>
									Organização
								</button>

								<button
									type="button"
									onClick={() => setSpeakerType("SUB_PERSON")}
									className={[
										"min-h-10 rounded-xl px-4 text-sm font-medium transition",
										speakerType === "SUB_PERSON"
											? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
											: "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
									].join(" ")}
								>
									Sub-organização
								</button>
							</div>

							<input type="hidden" name="speakerType" value={speakerType} />
						</fieldset>

						{speakerType === "PERSON" ? (
							<div className="space-y-2">
								<Label htmlFor={`speakerPersonId-${talk.id}`}>Orador</Label>
								<select
									id={`speakerPersonId-${talk.id}`}
									name="speakerPersonId"
									disabled={pending}
									defaultValue=""
									className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
								>
									<option value="">Selecione</option>
									{personSpeakers.map((speaker) => (
										<option key={speaker.id} value={speaker.id}>
											{speaker.name}
										</option>
									))}
								</select>
							</div>
						) : (
							<div className="space-y-2">
								<Label htmlFor={`speakerSubPersonId-${talk.id}`}>
									Orador visitante
								</Label>
								<select
									id={`speakerSubPersonId-${talk.id}`}
									name="speakerSubPersonId"
									disabled={pending}
									defaultValue=""
									className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
								>
									<option value="">Selecione</option>
									{subPersonSpeakers.map((speaker) => (
										<option key={speaker.id} value={speaker.id}>
											{speaker.name} · {speaker.subOrganizationName}
										</option>
									))}
								</select>
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor={`history-notes-${talk.id}`}>Notas</Label>
							<Textarea
								id={`history-notes-${talk.id}`}
								name="notes"
								rows={4}
								disabled={pending}
								className="rounded-2xl"
							/>
						</div>

						{state.error ? (
							<Alert variant="destructive">
								<AlertDescription>{state.error}</AlertDescription>
							</Alert>
						) : null}

						<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
								className="min-h-11 rounded-2xl"
								disabled={pending}
							>
								Fechar
							</Button>
							<Button
								type="submit"
								className="min-h-11 rounded-2xl"
								disabled={pending}
							>
								{pending ? "Registrando..." : "Registrar histórico"}
							</Button>
						</div>
					</form>
				</div>
			</DialogContent>
		</Dialog>
	);
}
