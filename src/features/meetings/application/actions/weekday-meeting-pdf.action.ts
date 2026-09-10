"use server";

import { z } from "zod";
import { requireMeetingContentManage } from "@/features/meeting-content/application/services/meeting-content-auth";
import { db } from "@/lib/db";
import { loadMeetingWeekQuery } from "../queries/load-meeting-week.query";

export type ActionResult<T = void> =
	| { ok: true; data: T }
	| { ok: false; error: string };

export type AvailableWeekdayMeetingDate = {
	id: string;
	date: string;
};

const ListDatesSchema = z.object({
	slug: z.string().min(1),
	kind: z.enum(["MIDWEEK", "WEEKEND"]).default("MIDWEEK"),
});

function toLocalDateOnly(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

export async function listWeekdayMeetingDatesAction(
	input: z.infer<typeof ListDatesSchema>,
): Promise<ActionResult<AvailableWeekdayMeetingDate[]>> {
	try {
		const parsed = ListDatesSchema.parse(input);

		await requireMeetingContentManage(parsed.slug);

		const organization = await db.organization.findUnique({
			where: { slug: parsed.slug },
			select: { id: true },
		});

		if (!organization) {
			return {
				ok: false,
				error: "Organização não encontrada.",
			};
		}

		const programs = await db.meetingProgram.findMany({
			where: {
				organizationId: organization.id,
				kind: parsed.kind,
				isCancelled: false,
				scheduledAt: {
					not: null,
				},
			},
			select: {
				id: true,
				scheduledAt: true,
			},
			orderBy: {
				scheduledAt: "asc",
			},
			take: 100,
		});

		const dates = programs.flatMap((program) => {
			if (!program.scheduledAt) {
				return [];
			}

			return [
				{
					id: program.id,
					date: toLocalDateOnly(program.scheduledAt),
				},
			];
		});

		return {
			ok: true,
			data: dates,
		};
	} catch (cause) {
		return {
			ok: false,
			error:
				cause instanceof Error
					? cause.message
					: "Não foi possível carregar as datas disponíveis.",
		};
	}
}

const LoadDetailsSchema = z.object({
	slug: z.string().min(1),
	weekStarts: z
		.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
		.min(1)
		.max(100),
});

export async function loadWeekdayMeetingDetailsAction(
	input: z.infer<typeof LoadDetailsSchema>,
): Promise<
	ActionResult<import("../../domain/meeting-types").MeetingWeekDto[]>
> {
	try {
		const parsed = LoadDetailsSchema.parse(input);

		await requireMeetingContentManage(parsed.slug);

		const uniqueWeekStarts = [...new Set(parsed.weekStarts)].sort((a, b) =>
			a.localeCompare(b),
		);

		const results = await Promise.all(
			uniqueWeekStarts.map((weekStart) =>
				loadMeetingWeekQuery({
					slug: parsed.slug,
					week: weekStart,
				}),
			),
		);

		return {
			ok: true,
			data: results,
		};
	} catch (cause) {
		return {
			ok: false,
			error:
				cause instanceof Error
					? cause.message
					: "Não foi possível carregar os detalhes das reuniões.",
		};
	}
}
