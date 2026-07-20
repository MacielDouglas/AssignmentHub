// src/features/cleaning/components/cleaning-sector-editor.tsx
"use client";

import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { CleaningSectorFormState } from "../domain/cleaning-settings.types";
import { isBathroomSectorName } from "../schemas/save-cleaning-settings.schema";

type Props = {
	prefix: string;
	type: "MEETING" | "WEEKLY" | "GENERAL";
	assignmentMode: string;
	sector: CleaningSectorFormState;
	readOnly: boolean;
	onChange: (sector: CleaningSectorFormState) => void;
	onRemove: () => void;
};

export function CleaningSectorEditor({
	prefix,
	type,
	assignmentMode,
	sector,
	readOnly,
	onChange,
	onRemove,
}: Props) {
	const showPeopleRequired = type !== "MEETING" || assignmentMode === "PERSON";
	const showAllowYoung = type === "MEETING" && assignmentMode === "PERSON";
	const showTargetSex = isBathroomSectorName(sector.name);

	return (
		<article
			className={`rounded-3xl border p-4 sm:p-5 ${
				sector.isActive
					? "border-border/60 bg-card"
					: "border-dashed border-border/50 bg-muted/20 opacity-80"
			}`}
		>
			<input type="hidden" name={`${prefix}.id`} value={sector.id ?? ""} />
			<input
				type="hidden"
				name={`${prefix}.sortOrder`}
				value={String(sector.sortOrder)}
			/>
			<input
				type="hidden"
				name={`${prefix}.isActive`}
				value={sector.isActive ? "true" : "false"}
			/>
			<input
				type="hidden"
				name={`${prefix}.allowYoung`}
				value={sector.allowYoung ? "true" : "false"}
			/>
			<input
				type="hidden"
				name={`${prefix}.targetSex`}
				value={showTargetSex ? sector.targetSex : ""}
			/>
			{!showPeopleRequired ? (
				<input type="hidden" name={`${prefix}.peopleRequired`} value="" />
			) : null}

			<div className="mb-4 flex flex-wrap items-start justify-between gap-3">
				<div className="space-y-1">
					<p className="text-sm font-semibold">Setor</p>
					<div className="flex flex-wrap gap-2">
						{!sector.isActive ? <Badge variant="outline">Inativo</Badge> : null}
						{sector.locked ? (
							<Badge className="border-0 bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/10">
								Histórico protegido
							</Badge>
						) : null}
					</div>
				</div>
				<Button
					type="button"
					variant="ghost"
					disabled={readOnly}
					onClick={onRemove}
					className="h-10 rounded-2xl text-red-600 hover:bg-red-50 hover:text-red-700"
				>
					<Trash2 className="mr-2 size-4" />
					Remover
				</Button>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2 sm:col-span-2">
					<Label>Nome do setor</Label>
					<Input
						name={`${prefix}.name`}
						value={sector.name}
						disabled={readOnly}
						onChange={(e) => onChange({ ...sector, name: e.target.value })}
						className="h-11 rounded-2xl"
						maxLength={80}
						placeholder="Ex.: Salão, Banheiro, Estacionamento"
					/>
				</div>

				{showPeopleRequired ? (
					<div className="space-y-2">
						<Label>Pessoas necessárias</Label>
						<Input
							type="number"
							min={1}
							max={50}
							name={`${prefix}.peopleRequired`}
							value={sector.peopleRequired}
							disabled={readOnly}
							onChange={(e) =>
								onChange({
									...sector,
									peopleRequired: Math.max(1, Number(e.target.value) || 1),
								})
							}
							className="h-11 rounded-2xl"
						/>
					</div>
				) : null}

				{showTargetSex ? (
					<div className="space-y-2">
						<Label>Sexo alvo (Banheiro)</Label>
						<Select
							value={sector.targetSex || "__all__"}
							disabled={readOnly}
							onValueChange={(value) =>
								onChange({
									...sector,
									targetSex:
										value === "__all__" ? "" : (value as "MALE" | "FEMALE"),
								})
							}
						>
							<SelectTrigger className="h-11 rounded-2xl">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__all__">Ambos</SelectItem>
								<SelectItem value="MALE">Masculino</SelectItem>
								<SelectItem value="FEMALE">Feminino</SelectItem>
							</SelectContent>
						</Select>
					</div>
				) : null}

				{showAllowYoung ? (
					<div className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-3 sm:col-span-2">
						<div>
							<p className="text-sm font-medium">Permitir jovens</p>
							<p className="text-xs text-muted-foreground">
								Inclui pessoas marcadas como jovens na rotação.
							</p>
						</div>
						<Switch
							checked={sector.allowYoung}
							disabled={readOnly}
							onCheckedChange={(allowYoung) =>
								onChange({ ...sector, allowYoung })
							}
						/>
					</div>
				) : null}

				<div className="space-y-2 sm:col-span-2">
					<Label>Descrição</Label>
					<Textarea
						name={`${prefix}.description`}
						value={sector.description}
						disabled={readOnly}
						onChange={(e) =>
							onChange({ ...sector, description: e.target.value })
						}
						className="min-h-20 rounded-2xl"
						maxLength={500}
					/>
				</div>
			</div>
		</article>
	);
}
