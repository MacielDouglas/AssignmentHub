// "use client";

// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Switch } from "@/components/ui/switch";
// import { Textarea } from "@/components/ui/textarea";
// import type {
// 	ScheduleItemFormState,
// 	ScheduleLeaderOption,
// 	ScheduleSettingsStateErrors,
// } from "../domain/schedule-settings.types";
// import { ScheduleErrorText } from "./schedule-error-text";
// import { ScheduleOccurrencesEditor } from "./schedule-occurrences-editor";
// import { ScheduleWeeklyRulesEditor } from "./schedule-weekly-rules-editor";

// type Props = {
// 	index: number;
// 	value: ScheduleItemFormState;
// 	leaders: ScheduleLeaderOption[];
// 	errors?: ScheduleSettingsStateErrors;
// 	onChange: (value: ScheduleItemFormState) => void;
// 	onReset: () => void;
// };

// export function ScheduleSettingsSection({
// 	index,
// 	value,
// 	leaders,
// 	errors,
// 	onChange,
// 	onReset,
// }: Props) {
// 	const namePrefix = `items.${index}`;
// 	const isMeetings = value.type === "MEETINGS";

// 	return (
// 		<section className="space-y-6 rounded-2xl border p-4 md:p-6">
// 			<div className="flex items-start justify-between gap-3">
// 				<div className="space-y-1">
// 					<h3 className="text-base font-semibold">{value.title}</h3>
// 					<p className="text-sm text-muted-foreground">
// 						{value.description || "Configure este tipo de evento."}
// 					</p>
// 				</div>

// 				<button
// 					type="button"
// 					onClick={onReset}
// 					className="text-sm font-medium text-primary"
// 				>
// 					Resetar padrão
// 				</button>
// 			</div>

// 			<input type="hidden" name={`${namePrefix}.id`} value={value.id ?? ""} />
// 			<input type="hidden" name={`${namePrefix}.type`} value={value.type} />
// 			<input type="hidden" name={`${namePrefix}.mode`} value={value.mode} />

// 			<div className="flex items-center justify-between rounded-xl border p-3">
// 				<div className="space-y-1">
// 					<p className="text-sm font-medium">Ativo</p>
// 					<p className="text-xs text-muted-foreground">
// 						Mostra este tipo no calendário e libera sua configuração.
// 					</p>
// 				</div>

// 				<Switch
// 					checked={value.isActive}
// 					onCheckedChange={(checked) =>
// 						onChange({
// 							...value,
// 							isActive: checked,
// 						})
// 					}
// 				/>
// 			</div>

// 			<input
// 				type="hidden"
// 				name={`${namePrefix}.isActive`}
// 				value={String(value.isActive)}
// 			/>

// 			<div className="grid gap-4 md:grid-cols-2">
// 				<div className="space-y-2">
// 					<Label htmlFor={`${namePrefix}-title`}>Título</Label>
// 					<Input
// 						id={`${namePrefix}-title`}
// 						value={value.title}
// 						onChange={(event) =>
// 							onChange({
// 								...value,
// 								title: event.target.value,
// 							})
// 						}
// 					/>
// 					<input
// 						type="hidden"
// 						name={`${namePrefix}.title`}
// 						value={value.title}
// 					/>
// 					<ScheduleErrorText errors={errors} field={`items.${index}.title`} />
// 				</div>

// 				<div className="space-y-2">
// 					<Label htmlFor={`${namePrefix}-effectiveFrom`}>
// 						Vigência inicial
// 					</Label>
// 					<Input
// 						id={`${namePrefix}-effectiveFrom`}
// 						type="date"
// 						value={value.effectiveFrom}
// 						onChange={(event) =>
// 							onChange({
// 								...value,
// 								effectiveFrom: event.target.value,
// 							})
// 						}
// 					/>
// 					<input
// 						type="hidden"
// 						name={`${namePrefix}.effectiveFrom`}
// 						value={value.effectiveFrom}
// 					/>
// 				</div>
// 			</div>

// 			<div className="grid gap-4 md:grid-cols-2">
// 				<div className="space-y-2">
// 					<Label htmlFor={`${namePrefix}-effectiveUntil`}>Vigência final</Label>
// 					<Input
// 						id={`${namePrefix}-effectiveUntil`}
// 						type="date"
// 						value={value.effectiveUntil}
// 						onChange={(event) =>
// 							onChange({
// 								...value,
// 								effectiveUntil: event.target.value,
// 							})
// 						}
// 					/>
// 					<input
// 						type="hidden"
// 						name={`${namePrefix}.effectiveUntil`}
// 						value={value.effectiveUntil}
// 					/>
// 				</div>

// 				<div className="space-y-2">
// 					<Label htmlFor={`${namePrefix}-description`}>Descrição</Label>
// 					<Textarea
// 						id={`${namePrefix}-description`}
// 						value={value.description}
// 						onChange={(event) =>
// 							onChange({
// 								...value,
// 								description: event.target.value,
// 							})
// 						}
// 						maxLength={500}
// 					/>
// 					<input
// 						type="hidden"
// 						name={`${namePrefix}.description`}
// 						value={value.description}
// 					/>
// 				</div>
// 			</div>

// 			{isMeetings ? (
// 				<ScheduleWeeklyRulesEditor
// 					namePrefix={namePrefix}
// 					value={value.weeklyRules}
// 					onChange={(weeklyRules) =>
// 						onChange({
// 							...value,
// 							weeklyRules: weeklyRules.map((rule, sortOrder) => ({
// 								...rule,
// 								sortOrder,
// 							})),
// 						})
// 					}
// 				/>
// 			) : (
// 				<ScheduleOccurrencesEditor
// 					namePrefix={namePrefix}
// 					type={value.type}
// 					mode={value.mode}
// 					value={value.occurrences}
// 					leaders={leaders}
// 					onChange={(occurrences) =>
// 						onChange({
// 							...value,
// 							occurrences: occurrences.map((occurrence, sortOrder) => ({
// 								...occurrence,
// 								sortOrder,
// 							})),
// 						})
// 					}
// 				/>
// 			)}
// 		</section>
// 	);
// }
