"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import {
	HiOutlineMicrophone,
	HiOutlinePlus,
	HiOutlineSpeakerWave,
	HiOutlineStar,
	HiOutlineTrash,
	HiOutlineUsers,
	HiOutlineVideoCamera,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import { saveDutySettingsAction } from "@/features/settings/assignments/actions/save-duty-settings-action";
import type { DutySettingsView } from "@/features/settings/assignments/lib/duty-settings";

const initialState: SettingsActionState = { success: false, message: "" };

const inputClassName = "h-11 rounded-2xl";

function SectorRow({
	icon: Icon,
	title,
	description,
	switchId,
	active,
	onActiveChange,
	activeName,
	canEdit,
	children,
}: {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	description: string;
	switchId: string;
	active: boolean;
	onActiveChange: (next: boolean) => void;
	activeName: string;
	canEdit: boolean;
	children?: React.ReactNode;
}) {
	const t = useTranslations("SettingsDuties");

	return (
		<div className="space-y-3 rounded-3xl border border-border p-4">
			<div className="flex items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-2.5">
					<Icon className="h-5 w-5 shrink-0 text-primary" />
					<div className="min-w-0">
						<p className="text-sm font-semibold text-foreground">{title}</p>
						<p className="text-xs text-muted-foreground">{description}</p>
					</div>
				</div>

				<div className="flex shrink-0 items-center gap-2">
					<Label htmlFor={switchId} className="text-xs text-muted-foreground">
						{active ? t("active") : t("inactive")}
					</Label>
					<Switch
						id={switchId}
						checked={active}
						onCheckedChange={onActiveChange}
						disabled={!canEdit}
					/>
				</div>
			</div>

			<input
				type="hidden"
				name={activeName}
				value={active ? "true" : "false"}
			/>

			{active ? children : null}
		</div>
	);
}

export function DutySettingsPanel({
	organizationSlug,
	canEdit,
	settings,
}: {
	organizationSlug: string;
	canEdit: boolean;
	settings: DutySettingsView;
}) {
	const router = useRouter();
	const t = useTranslations("SettingsDuties");
	const [state, formAction, pending] = useActionState(
		saveDutySettingsAction,
		initialState,
	);

	const [indicatorActive, setIndicatorActive] = useState(
		settings.indicatorActive,
	);
	const [micActive, setMicActive] = useState(settings.micActive);
	const [soundActive, setSoundActive] = useState(settings.soundActive);
	const [videoActive, setVideoActive] = useState(settings.videoActive);
	const [stageActive, setStageActive] = useState(settings.stageActive);
	const [sectors, setSectors] = useState<Array<{ id: string; name: string }>>(
		settings.indicatorSectors.map((name) => ({
			id: crypto.randomUUID(),
			name,
		})),
	);

	useEffect(() => {
		if (state.success) {
			router.refresh();
		}
	}, [state.success, router]);

	function addSector() {
		if (sectors.length >= 20) {
			return;
		}

		setSectors((current) => [
			...current,
			{ id: crypto.randomUUID(), name: "" },
		]);
	}

	function updateSector(id: string, value: string) {
		setSectors((current) =>
			current.map((sector) =>
				sector.id === id ? { ...sector, name: value.slice(0, 80) } : sector,
			),
		);
	}

	function removeSector(id: string) {
		setSectors((current) => current.filter((sector) => sector.id !== id));
	}

	return (
		<section className="space-y-4 rounded-4xl border border-border bg-card p-5 shadow-sm sm:p-6">
			<header className="space-y-1">
				<h2 className="text-headline text-foreground">{t("title")}</h2>
				<p className="text-sm text-muted-foreground">{t("description")}</p>
			</header>

			<div className="rounded-3xl bg-muted/50 p-4 text-sm text-muted-foreground">
				<p className="font-semibold text-foreground">{t("howItWorks")}</p>
				<ul className="mt-1.5 list-disc space-y-1 pl-5">
					<li>{t("tipIndicators")}</li>
					<li>{t("tipMics")}</li>
					<li>{t("tipSingle")}</li>
					<li>{t("tipQualified")}</li>
				</ul>
			</div>

			<form action={formAction} className="space-y-3">
				<input type="hidden" name="organizationSlug" value={organizationSlug} />
				<input
					type="hidden"
					name="indicatorSectors"
					value={JSON.stringify(sectors.map((sector) => sector.name))}
				/>

				<SectorRow
					icon={HiOutlineUsers}
					title={t("indicatorTitle")}
					description={t("indicatorDescription")}
					switchId="duty-indicator-active"
					active={indicatorActive}
					onActiveChange={setIndicatorActive}
					activeName="indicatorActive"
					canEdit={canEdit}
				>
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="duty-indicator-count">{t("quantity")}</Label>
							<Input
								id="duty-indicator-count"
								name="indicatorCount"
								type="number"
								min={1}
								max={50}
								defaultValue={settings.indicatorCount}
								disabled={!canEdit}
								className={inputClassName}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label>{t("indicatorSectors")}</Label>
						<p className="text-xs text-muted-foreground">{t("sectorsHint")}</p>

						{sectors.map((sector, index) => (
							<div key={sector.id} className="flex items-center gap-2">
								<Input
									value={sector.name}
									onChange={(event) =>
										updateSector(sector.id, event.target.value)
									}
									disabled={!canEdit}
									maxLength={80}
									placeholder={t("sectorPlaceholder", {
										index: index + 1,
									})}
									className={inputClassName}
									aria-label={t("sectorAria", { index: index + 1 })}
								/>
								{canEdit ? (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => removeSector(sector.id)}
										className="h-11 w-11 shrink-0 rounded-2xl text-destructive hover:bg-destructive/10"
										aria-label={t("removeSector", { index: index + 1 })}
									>
										<HiOutlineTrash className="h-4 w-4" />
									</Button>
								) : null}
							</div>
						))}

						{canEdit ? (
							<Button
								type="button"
								variant="outline"
								onClick={addSector}
								disabled={sectors.length >= 20}
								className="h-11 rounded-2xl"
							>
								<HiOutlinePlus className="mr-1.5 h-4 w-4" />
								{t("addSector")}
							</Button>
						) : null}
					</div>
				</SectorRow>

				<SectorRow
					icon={HiOutlineMicrophone}
					title={t("micTitle")}
					description={t("micDescription")}
					switchId="duty-mic-active"
					active={micActive}
					onActiveChange={setMicActive}
					activeName="micActive"
					canEdit={canEdit}
				>
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="duty-mic-count">{t("quantity")}</Label>
							<Input
								id="duty-mic-count"
								name="micCount"
								type="number"
								min={1}
								max={50}
								defaultValue={settings.micCount}
								disabled={!canEdit}
								className={inputClassName}
							/>
						</div>
					</div>
				</SectorRow>

				<SectorRow
					icon={HiOutlineSpeakerWave}
					title={t("soundTitle")}
					description={t("soundDescription")}
					switchId="duty-sound-active"
					active={soundActive}
					onActiveChange={setSoundActive}
					activeName="soundActive"
					canEdit={canEdit}
				/>

				<SectorRow
					icon={HiOutlineVideoCamera}
					title={t("videoTitle")}
					description={t("videoDescription")}
					switchId="duty-video-active"
					active={videoActive}
					onActiveChange={setVideoActive}
					activeName="videoActive"
					canEdit={canEdit}
				/>

				<SectorRow
					icon={HiOutlineStar}
					title={t("stageTitle")}
					description={t("stageDescription")}
					switchId="duty-stage-active"
					active={stageActive}
					onActiveChange={setStageActive}
					activeName="stageActive"
					canEdit={canEdit}
				/>

				{canEdit ? (
					<Button
						type="submit"
						disabled={pending}
						className="h-11 rounded-4xl bg-primary text-primary-foreground"
					>
						{pending ? t("saving") : t("saveSectors")}
					</Button>
				) : null}
			</form>

			{state.message ? (
				<p
					className={`text-sm ${state.success ? "text-emerald-600" : "text-red-600"}`}
				>
					{state.message}
				</p>
			) : null}
		</section>
	);
}
