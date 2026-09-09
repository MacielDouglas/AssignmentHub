"use client";

import { FileDownIcon } from "lucide-react";
import { useState } from "react";
import { HiOutlinePencilSquare, HiOutlinePlus } from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import type { MeetingWeekDto } from "../../domain/meeting-types";
import { CreateWeekdayMeetingPdfDialog } from "./create-weekday-meeting-pdf-dialog";
import { MeetingProgramCard } from "./meeting-program-card";
import { MeetingWeekModal } from "./meeting-week-modal";

type Props = {
	data: MeetingWeekDto;
	view: "midweek" | "weekend";
};

export function MeetingWeekSection({ data, view }: Props) {
	const [modalOpen, setModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<"create" | "edit">("create");
	const [pdfDialogOpen, setPdfDialogOpen] = useState(false);

	const program = view === "midweek" ? data.midweek : data.weekend;
	const hasMeeting = program.parts.length > 0 && !program.isCancelled;

	const handleCreate = () => {
		setModalMode("create");
		setModalOpen(true);
	};

	const handleEdit = () => {
		setModalMode("edit");
		setModalOpen(true);
	};

	return (
		<>
			{!hasMeeting ? (
				<section className="overflow-hidden rounded-[28px] bg-card shadow-sm ring-1 ring-border/40">
					<div className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
							<HiOutlinePlus className="h-6 w-6" />
						</div>

						<div className="flex-1">
							<h3 className="text-title text-foreground">
								Nenhuma reunião criada para esta semana
							</h3>
							<p className="mt-1 text-body-sm text-muted-foreground">
								Clique em &quot;Criar Reunião&quot; para gerar o programa a
								partir da apostila.
							</p>
						</div>

						<Button onClick={handleCreate} className="shrink-0">
							<HiOutlinePlus className="mr-2 h-4 w-4" />
							Criar Reunião
						</Button>
					</div>
				</section>
			) : (
				<>
					<div className="mb-3 flex items-center gap-2">
						<Button variant="outline" size="sm" onClick={handleEdit}>
							<HiOutlinePencilSquare className="mr-1.5 h-4 w-4" />
							Editar
						</Button>

						{view === "midweek" && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPdfDialogOpen(true)}
							>
								<FileDownIcon className="mr-1.5 h-4 w-4" />
								Criar PDF
							</Button>
						)}
					</div>

					<MeetingProgramCard
						slug={data.organizationSlug}
						program={program}
						canManage={data.canManage}
						variant={view}
					/>
				</>
			)}

			<MeetingWeekModal
				open={modalOpen}
				onOpenChange={setModalOpen}
				slug={data.organizationSlug}
				initialWeekStart={data.weekStart}
				mode={modalMode}
			/>

			{view === "midweek" && (
				<CreateWeekdayMeetingPdfDialog
					open={pdfDialogOpen}
					onOpenChange={setPdfDialogOpen}
					slug={data.organizationSlug}
					currentLocale={data.locale}
				/>
			)}
		</>
	);
}
