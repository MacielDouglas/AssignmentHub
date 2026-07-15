"use client";

import { Button } from "@/components/ui/button";
import type {
	ScheduleItemFormState,
	ScheduleSettingsStateErrors,
} from "../domain/schedule-settings.types";
import { ScheduleOccurrencesEditor } from "./schedule-occurrences-editor";
import { ScheduleWeeklyRulesEditor } from "./schedule-weekly-rules-editor";

type Props = {
	meetings: ScheduleItemFormState;
	specialMeeting: ScheduleItemFormState;
	nextYearMeeting: ScheduleItemFormState | null;
	errors?: ScheduleSettingsStateErrors;
	onMeetingsChange: (value: ScheduleItemFormState) => void;
	onSpecialMeetingChange: (value: ScheduleItemFormState) => void;
	onAddNextYearMeeting: () => void;
	onNextYearMeetingChange: (value: ScheduleItemFormState) => void;
	onResetMeetingItem: (type: ScheduleItemFormState["type"]) => void;
};

export function ScheduleMeetingsTab({
	meetings,
	specialMeeting,
	nextYearMeeting,
	onMeetingsChange,
	onSpecialMeetingChange,
	onAddNextYearMeeting,
	onNextYearMeetingChange,
	onResetMeetingItem,
}: Props) {
	return (
		<div className="space-y-6">
			<section className="space-y-6 rounded-2xl border p-4 md:p-6">
				<div className="flex items-start justify-between gap-3">
					<div className="space-y-1">
						<h3 className="text-base font-semibold">Reuniões</h3>
						<p className="text-sm text-muted-foreground">
							Configure a agenda semanal principal da congregação.
						</p>
					</div>

					<Button
						type="button"
						variant="ghost"
						onClick={() => onResetMeetingItem("MEETINGS")}
					>
						Resetar padrão
					</Button>
				</div>

				<input type="hidden" name={`items.0.id`} value={meetings.id ?? ""} />
				<input type="hidden" name={`items.0.type`} value={meetings.type} />
				<input type="hidden" name={`items.0.mode`} value={meetings.mode} />
				<input type="hidden" name={`items.0.title`} value={meetings.title} />
				<input
					type="hidden"
					name={`items.0.description`}
					value={meetings.description}
				/>
				<input type="hidden" name={`items.0.isActive`} value="true" />

				<ScheduleWeeklyRulesEditor
					namePrefix="items.0"
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
			</section>

			<section className="space-y-6 rounded-2xl border p-4 md:p-6">
				<div className="flex items-start justify-between gap-3">
					<div className="space-y-1">
						<h3 className="text-base font-semibold">Reunião especial</h3>
						<p className="text-sm text-muted-foreground">
							Adicione datas especiais que substituem a reunião de fim de
							semana.
						</p>
					</div>

					<Button
						type="button"
						variant="ghost"
						onClick={() => onResetMeetingItem("SPECIAL_MEETING")}
					>
						Resetar padrão
					</Button>
				</div>

				<div className="flex items-center justify-between rounded-xl border p-3">
					<div className="space-y-1">
						<p className="text-sm font-medium">Ativa</p>
						<p className="text-xs text-muted-foreground">
							Habilita o cadastro de reuniões especiais.
						</p>
					</div>

					<input
						type="checkbox"
						className="size-4"
						checked={specialMeeting.isActive}
						onChange={(event) =>
							onSpecialMeetingChange({
								...specialMeeting,
								isActive: event.target.checked,
							})
						}
					/>
				</div>

				<input
					type="hidden"
					name={`items.1.id`}
					value={specialMeeting.id ?? ""}
				/>
				<input
					type="hidden"
					name={`items.1.type`}
					value={specialMeeting.type}
				/>
				<input
					type="hidden"
					name={`items.1.mode`}
					value={specialMeeting.mode}
				/>
				<input
					type="hidden"
					name={`items.1.title`}
					value={specialMeeting.title}
				/>
				<input
					type="hidden"
					name={`items.1.description`}
					value={specialMeeting.description}
				/>
				<input
					type="hidden"
					name={`items.1.isActive`}
					value={String(specialMeeting.isActive)}
				/>

				<ScheduleOccurrencesEditor
					namePrefix="items.1"
					type={specialMeeting.type}
					value={specialMeeting.occurrences}
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
			</section>

			<section className="space-y-4 rounded-2xl border p-4 md:p-6">
				<div className="flex items-start justify-between gap-3">
					<div className="space-y-1">
						<h3 className="text-base font-semibold">Reunião próximo ano</h3>
						<p className="text-sm text-muted-foreground">
							Cadastre uma segunda agenda semanal para o próximo ano.
						</p>
					</div>

					{!nextYearMeeting ? (
						<Button
							type="button"
							variant="outline"
							onClick={onAddNextYearMeeting}
						>
							Adicionar reunião próximo ano
						</Button>
					) : (
						<Button
							type="button"
							variant="ghost"
							onClick={() => onResetMeetingItem("MEETINGS")}
						>
							Resetar padrão
						</Button>
					)}
				</div>

				{nextYearMeeting ? (
					<>
						<input
							type="hidden"
							name={`items.2.id`}
							value={nextYearMeeting.id ?? ""}
						/>
						<input
							type="hidden"
							name={`items.2.type`}
							value={nextYearMeeting.type}
						/>
						<input
							type="hidden"
							name={`items.2.mode`}
							value={nextYearMeeting.mode}
						/>
						<input
							type="hidden"
							name={`items.2.title`}
							value={nextYearMeeting.title}
						/>
						<input
							type="hidden"
							name={`items.2.description`}
							value={nextYearMeeting.description}
						/>
						<input type="hidden" name={`items.2.isActive`} value="true" />

						<ScheduleWeeklyRulesEditor
							namePrefix="items.2"
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
					</>
				) : (
					<p className="text-sm text-muted-foreground">
						Nenhuma agenda do próximo ano foi adicionada ainda.
					</p>
				)}
			</section>
		</div>
	);
}
