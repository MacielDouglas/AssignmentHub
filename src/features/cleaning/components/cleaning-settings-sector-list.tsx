// "use client";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Switch } from "@/components/ui/switch";
// import { Textarea } from "@/components/ui/textarea";
// // import type { SectorItem } from "@/features/cleaning/domain/cleaning-settings.types";

// type Props = {
// 	namePrefix: string;
// 	value: SectorItem[];
// 	disabled?: boolean;
// 	showAllowYoung?: boolean;
// 	onChange: (value: SectorItem[]) => void;
// };

// function createEmptySector(index: number, namePrefix: string): SectorItem {
// 	return {
// 		clientKey: `${namePrefix}-new-${index}-${crypto.randomUUID()}`,
// 		name: "",
// 		description: "",
// 		peopleRequired: "",
// 		allowYoung: true,
// 		sortOrder: index,
// 		isActive: true,
// 	};
// }

// export function CleaningSettingsSectorList({
// 	namePrefix,
// 	value,
// 	disabled,
// 	showAllowYoung = false,
// 	onChange,
// }: Props) {
// 	function normalize(next: SectorItem[]) {
// 		return next.map((sector, index) => ({
// 			...sector,
// 			sortOrder: index,
// 			clientKey:
// 				sector.id || sector.clientKey
// 					? sector.clientKey
// 					: `${namePrefix}-new-${index}`,
// 		}));
// 	}

// 	function updateSector(index: number, next: Partial<SectorItem>) {
// 		onChange(
// 			normalize(
// 				value.map((sector, currentIndex) =>
// 					currentIndex === index ? { ...sector, ...next } : sector,
// 				),
// 			),
// 		);
// 	}

// 	function addSector() {
// 		onChange(
// 			normalize([...value, createEmptySector(value.length, namePrefix)]),
// 		);
// 	}

// 	function removeSector(index: number) {
// 		onChange(
// 			normalize(value.filter((_, currentIndex) => currentIndex !== index)),
// 		);
// 	}

// 	return (
// 		<div className="space-y-4">
// 			<div className="flex items-center justify-between gap-3">
// 				<div>
// 					<h4 className="text-sm font-semibold">Setores</h4>
// 					<p className="text-sm text-muted-foreground">
// 						Defina os setores que serão usados na designação.
// 					</p>
// 				</div>

// 				<Button
// 					type="button"
// 					variant="outline"
// 					onClick={addSector}
// 					disabled={disabled}
// 				>
// 					Adicionar setor
// 				</Button>
// 			</div>

// 			<div className="space-y-4">
// 				{value.map((sector, index) => {
// 					const itemId = `${namePrefix}-${sector.id ?? sector.clientKey}`;

// 					return (
// 						<section
// 							key={sector.id ?? sector.clientKey}
// 							aria-label={`Setor ${index + 1}`}
// 							className="space-y-4 rounded-2xl border p-4"
// 						>
// 							<div className="flex items-center justify-between gap-3">
// 								<h5 className="text-sm font-medium">Setor {index + 1}</h5>

// 								<Button
// 									type="button"
// 									variant="ghost"
// 									onClick={() => removeSector(index)}
// 									disabled={disabled}
// 								>
// 									Remover
// 								</Button>
// 							</div>

// 							<div className="grid gap-4 md:grid-cols-2">
// 								<div className="space-y-2">
// 									<Label htmlFor={`${itemId}-name`}>Nome do setor</Label>
// 									<Input
// 										id={`${itemId}-name`}
// 										value={sector.name}
// 										onChange={(event) =>
// 											updateSector(index, { name: event.target.value })
// 										}
// 										disabled={disabled}
// 										placeholder="Ex. Limpar banheiro"
// 									/>
// 								</div>

// 								<div className="space-y-2">
// 									<Label htmlFor={`${itemId}-people`}>
// 										Pessoas necessárias
// 									</Label>
// 									<Input
// 										id={`${itemId}-people`}
// 										type="number"
// 										min={1}
// 										max={50}
// 										value={sector.peopleRequired}
// 										onChange={(event) =>
// 											updateSector(index, {
// 												peopleRequired: event.target.value,
// 											})
// 										}
// 										disabled={disabled}
// 										placeholder="Opcional"
// 									/>
// 								</div>
// 							</div>

// 							<div className="space-y-2">
// 								<Label htmlFor={`${itemId}-description`}>Descrição</Label>
// 								<Textarea
// 									id={`${itemId}-description`}
// 									value={sector.description}
// 									onChange={(event) =>
// 										updateSector(index, { description: event.target.value })
// 									}
// 									disabled={disabled}
// 									placeholder="Detalhes ou instruções do setor."
// 									maxLength={300}
// 								/>
// 							</div>

// 							<div className="flex flex-col gap-3 rounded-xl border p-3">
// 								<div className="flex items-center justify-between gap-3">
// 									<div className="space-y-1">
// 										<p className="text-sm font-medium">Setor ativo</p>
// 										<p className="text-xs text-muted-foreground">
// 											Quando desativado, o setor permanece salvo mas não é
// 											usado.
// 										</p>
// 									</div>
// 									<Switch
// 										checked={sector.isActive}
// 										onCheckedChange={(checked) =>
// 											updateSector(index, { isActive: checked })
// 										}
// 										disabled={disabled}
// 									/>
// 								</div>

// 								{showAllowYoung ? (
// 									<div className="flex items-center justify-between gap-3">
// 										<div className="space-y-1">
// 											<p className="text-sm font-medium">Permitir jovens</p>
// 											<p className="text-xs text-muted-foreground">
// 												Se desativado, pessoas com young = true não poderão ser
// 												designadas.
// 											</p>
// 										</div>
// 										<Switch
// 											checked={sector.allowYoung}
// 											onCheckedChange={(checked) =>
// 												updateSector(index, { allowYoung: checked })
// 											}
// 											disabled={disabled}
// 										/>
// 									</div>
// 								) : null}
// 							</div>

// 							<input
// 								type="hidden"
// 								name={`${namePrefix}.sectors.${index}.id`}
// 								value={sector.id ?? ""}
// 							/>
// 							<input
// 								type="hidden"
// 								name={`${namePrefix}.sectors.${index}.name`}
// 								value={sector.name}
// 							/>
// 							<input
// 								type="hidden"
// 								name={`${namePrefix}.sectors.${index}.description`}
// 								value={sector.description}
// 							/>
// 							<input
// 								type="hidden"
// 								name={`${namePrefix}.sectors.${index}.peopleRequired`}
// 								value={sector.peopleRequired}
// 							/>
// 							<input
// 								type="hidden"
// 								name={`${namePrefix}.sectors.${index}.allowYoung`}
// 								value={String(sector.allowYoung)}
// 							/>
// 							<input
// 								type="hidden"
// 								name={`${namePrefix}.sectors.${index}.sortOrder`}
// 								value={String(index)}
// 							/>
// 							<input
// 								type="hidden"
// 								name={`${namePrefix}.sectors.${index}.isActive`}
// 								value={String(sector.isActive)}
// 							/>
// 						</section>
// 					);
// 				})}
// 			</div>
// 		</div>
// 	);
// }
