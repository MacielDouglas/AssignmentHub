"use client";

import { CalendarPlus2, RotateCcw, Save, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ScheduleItemFormState, ScheduleLeaderOption } from "../domain/schedule-settings.types";
import type {
	ScheduleType,
	ScheduleVariant,
} from "../schemas/save-schedule-settings.schema";
import { ScheduleOccurrencesEditor } from "./schedule-occurrences-editor";
import { ScheduleWeeklyRulesEditor } from "./schedule-weekly-rules-editor";

type Props = {
	meetings: ScheduleItemFormState;
	specialMeeting: ScheduleItemFormState;
	nextYearMeeting: ScheduleItemFormState | null;
	pending: boolean;
	onSubmitSection: () => void;
	onMeetingsChange: (value: ScheduleItemFormState) => void;
	onSpecialMeetingChange: (value: ScheduleItemFormState) => void;
	onAddNextYearMeeting: () => void;
	onRemoveNextYearMeeting: () => void;
	onNextYearMeetingChange: (value: ScheduleItemFormState) => void;
	onResetMeetingItem: (type: ScheduleType, variant?: ScheduleVariant) => void;
	leaders: ScheduleLeaderOption[];
};

type SectionCardProps = {
	title: string;
	description: string;
	action?: ReactNode;
	children: ReactNode;
};

function SectionCard({
	title,
	description,
	action,
	children,
}: SectionCardProps) {
	return (
		<section className="space-y-5 rounded-3xl border border-border/60 bg-background p-4 shadow-sm sm:p-6">
			<header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-1">
					<h3 className="text-lg font-semibold tracking-tight text-foreground">
						{title}
					</h3>
					<p className="text-sm leading-6 text-muted-foreground">
						{description}
					</p>
				</div>

				{action ? <div className="shrink-0">{action}</div> : null}
			</header>

			{children}
		</section>
	);
}

function SaveSectionButton({
	pending,
	onSubmit,
}: {
	pending: boolean;
	onSubmit: () => void;
}) {
	return (
		<div className="flex justify-end">
			<Button
				type="button"
				onClick={onSubmit}
				disabled={pending}
				className="rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8]"
			>
				<Save className="mr-2 size-4" />
				{pending ? "Salvando..." : "Salvar alterações"}
			</Button>
		</div>
	);
}

export function ScheduleMeetingsTab({
	meetings,
	specialMeeting,
	nextYearMeeting,
	pending,
	onSubmitSection,
	onMeetingsChange,
	onSpecialMeetingChange,
	onAddNextYearMeeting,
	onRemoveNextYearMeeting,
	onNextYearMeetingChange,
	onResetMeetingItem,
	leaders,
}: Props) {
	const currentYear = new Date().getFullYear();

	return (
		<div className="space-y-4">
			<SectionCard
				title="Reuniões"
				description="Configure a agenda semanal principal da organização com até duas reuniões por semana."
				action={
					<Button
						type="button"
						variant="ghost"
						onClick={() => onResetMeetingItem("MEETINGS", "DEFAULT")}
						className="rounded-2xl"
					>
						<RotateCcw className="mr-2 size-4" />
						Resetar padrão
					</Button>
				}
			>
				<ScheduleWeeklyRulesEditor
					value={meetings.weeklyRules}
					onChange={(weeklyRules) =>
						onMeetingsChange({
							...meetings,
							isActive: true,
							weeklyRules: weeklyRules.map((rule, sortOrder) => ({
								...rule,
								sortOrder,
							})),
						})
					}
				/>

				<SaveSectionButton pending={pending} onSubmit={onSubmitSection} />
			</SectionCard>

			<SectionCard
				title="Reunião especial"
				description="Adicione quantas reuniões especiais forem necessárias. Cada ocorrência pode substituir uma reunião regular."
				action={
					<Button
						type="button"
						variant="ghost"
						onClick={() => onResetMeetingItem("SPECIAL_MEETING", "DEFAULT")}
						className="rounded-2xl"
					>
						<RotateCcw className="mr-2 size-4" />
						Resetar padrão
					</Button>
				}
			>
				<div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-4">
					<div className="space-y-1">
						<p className="text-sm font-medium text-foreground">Ativar seção</p>
						<p className="text-xs text-muted-foreground">
							Habilita o cadastro de reuniões especiais com opção de horário ou
							dia inteiro.
						</p>
					</div>

					<Switch
						checked={specialMeeting.isActive}
						onCheckedChange={(checked) =>
							onSpecialMeetingChange({
								...specialMeeting,
								isActive: checked,
							})
						}
					/>
				</div>

				<ScheduleOccurrencesEditor
					type={specialMeeting.type}
					value={specialMeeting.occurrences}
					leaders={leaders}
					disabled={!specialMeeting.isActive}
					onChange={(occurrences) =>
						onSpecialMeetingChange({
							...specialMeeting,
							occurrences: occurrences.map((occurrence, sortOrder) => ({
								...occurrence,
								sortOrder,
							})),
						})
					}
				/>

				<SaveSectionButton pending={pending} onSubmit={onSubmitSection} />
			</SectionCard>

			<SectionCard
				title="Reuniões do próximo ano"
				description="Opcional. Quando configurada, esta agenda semanal passa a valer no início do ano informado."
action={
				nextYearMeeting ? (
					<div className="flex items-center gap-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => onResetMeetingItem("MEETINGS", "NEXT_YEAR")}
							className="rounded-2xl"
						>
							<RotateCcw className="mr-2 size-4" />
							Resetar padrão
						</Button>
						<Button
							type="button"
							variant="ghost"
							onClick={onRemoveNextYearMeeting}
							className="rounded-2xl text-destructive hover:bg-destructive/10"
						>
							<Trash2 className="mr-2 size-4" />
							Remover
						</Button>
					</div>
				) : (
					<Button
						type="button"
						variant="outline"
						onClick={onAddNextYearMeeting}
						className="rounded-2xl"
					>
						<CalendarPlus2 className="mr-2 size-4" />
						Adicionar reunião futura
					</Button>
				)
			}
			>
				{nextYearMeeting ? (
					<div className="space-y-5">
						<div className="grid gap-4 lg:grid-cols-[220px_1fr]">
							<div className="space-y-2">
								<Label htmlFor="next-year-effectiveFromYear">
									Ano de vigência
								</Label>
								<Input
									id="next-year-effectiveFromYear"
									type="number"
									min={currentYear}
									max={2100}
									value={nextYearMeeting.effectiveFromYear ?? ""}
									onChange={(event) =>
										onNextYearMeetingChange({
											...nextYearMeeting,
											effectiveFromYear:
												event.target.value.trim() === ""
													? null
													: Number(event.target.value),
										})
									}
								/>
								<p className="text-xs text-muted-foreground">
									A agenda será aplicada a partir de 01/01 do ano informado.
								</p>
							</div>
						</div>

						<ScheduleWeeklyRulesEditor
							value={nextYearMeeting.weeklyRules}
							onChange={(weeklyRules) =>
								onNextYearMeetingChange({
									...nextYearMeeting,
									isActive: true,
									weeklyRules: weeklyRules.map((rule, sortOrder) => ({
										...rule,
										sortOrder,
									})),
								})
							}
						/>

						<SaveSectionButton pending={pending} onSubmit={onSubmitSection} />
					</div>
				) : (
					<div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
						Nenhuma agenda futura foi adicionada ainda. Sem essa configuração,
						as reuniões permanecem iguais no próximo ano.
					</div>
				)}
			</SectionCard>
		</div>
	);
}
