"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

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
	error: null as string | null,
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
	const [formInstance, setFormInstance] = useState(0);
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

	useEffect(() => {
		if (!state.success) return;

		const id = setTimeout(() => setOpen(false), 0);
		return () => clearTimeout(id);
	}, [state.success]);

	function handleOpenChange(nextOpen: boolean) {
		if (pending) return;

		if (nextOpen) {
			setFormInstance((current) => current + 1);
			setSpeakerType("PERSON");
		}

		setOpen(nextOpen);
	}

	const formKey = `${talk.id}-${formInstance}`;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>

			<DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-[28px] p-0 sm:w-full">
				<DialogHeader className="sticky top-0 z-10 border-b border-border bg-card px-5 py-4 text-left">
					<DialogTitle className="pr-8 text-title leading-6 text-foreground">
						Histórico · Nº {talk.number} · {talk.title}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-5 px-5 py-5">
					<section
						aria-labelledby={`history-list-${talk.id}`}
						className="space-y-3"
					>
						<div className="flex items-center justify-between gap-3">
							<h3
								id={`history-list-${talk.id}`}
								className="text-title text-foreground"
							>
								Registros anteriores
							</h3>

							<span className="inline-flex min-h-8 items-center rounded-full bg-muted px-3 text-label text-muted-foreground">
								{talk.latestHistory.length}
							</span>
						</div>

						<div className="max-h-60 overflow-y-auto pr-1">
							<PublicTalkHistoryList
								history={talk.latestHistory}
								slug={slug}
								organizationId={organizationId}
								canDelete
							/>
						</div>
					</section>

					<div className="border-t border-border" />

					<form key={formKey} action={formAction} className="space-y-4">
						<div>
							<h3 className="text-title text-foreground">
								Registrar novo histórico
							</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								Informe quem apresentou este discurso e a data da apresentação.
							</p>
						</div>

						<input type="hidden" name="slug" value={slug} />
						<input type="hidden" name="organizationId" value={organizationId} />
						<input type="hidden" name="publicTalkId" value={talk.id} />

						<div className="space-y-2">
							<Label htmlFor={`performedAt-${formKey}`}>Data</Label>

							<input
								id={`performedAt-${formKey}`}
								type="date"
								name="performedAt"
								defaultValue={toDateInputValue(new Date())}
								disabled={pending}
								className="min-h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm"
							/>
						</div>

						<fieldset className="space-y-2">
							<legend className="text-sm font-medium text-foreground">
								Tipo de orador
							</legend>

							<div className="grid grid-cols-2 rounded-2xl border border-border bg-muted p-1">
								<button
									type="button"
									onClick={() => setSpeakerType("PERSON")}
									disabled={pending}
									className={[
										"min-h-10 rounded-xl px-3 text-sm font-medium transition",
										speakerType === "PERSON"
											? "bg-card text-foreground shadow-sm"
											: "text-muted-foreground hover:text-foreground",
									].join(" ")}
								>
									Organização
								</button>

								<button
									type="button"
									onClick={() => setSpeakerType("SUB_PERSON")}
									disabled={pending}
									className={[
										"min-h-10 rounded-xl px-3 text-sm font-medium transition",
										speakerType === "SUB_PERSON"
											? "bg-card text-foreground shadow-sm"
											: "text-muted-foreground hover:text-foreground",
									].join(" ")}
								>
									Sub-organização
								</button>
							</div>

							<input type="hidden" name="speakerType" value={speakerType} />
						</fieldset>

						{speakerType === "PERSON" ? (
							<div className="space-y-2">
								<Label htmlFor={`speakerPersonId-${formKey}`}>Orador</Label>

								<select
									id={`speakerPersonId-${formKey}`}
									name="speakerPersonId"
									disabled={pending}
									defaultValue=""
									className="min-h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm"
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
								<Label htmlFor={`speakerSubPersonId-${formKey}`}>
									Orador visitante
								</Label>

								<select
									id={`speakerSubPersonId-${formKey}`}
									name="speakerSubPersonId"
									disabled={pending}
									defaultValue=""
									className="min-h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm"
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
							<Label htmlFor={`history-notes-${formKey}`}>Notas</Label>

							<Textarea
								id={`history-notes-${formKey}`}
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

						<div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
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
