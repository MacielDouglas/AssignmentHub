// src/features/cleaning-list/lib/cleaning-list.selects.ts
import type { Prisma } from "@/generated/prisma/client";

export const cleaningConfigSelect = {
	id: true,
	type: true,
	enabled: true,
	assignmentMode: true,
	notes: true,
	weekdays: {
		orderBy: { sortOrder: "asc" },
		select: { id: true, weekday: true, sortOrder: true },
	},
	dates: {
		orderBy: { date: "asc" },
		select: { id: true, date: true, label: true },
	},
	sectors: {
		where: { isActive: true },
		orderBy: { sortOrder: "asc" },
		select: {
			id: true,
			name: true,
			description: true,
			peopleRequired: true,
			allowYoung: true,
			targetSex: true,
			sortOrder: true,
			isActive: true,
		},
	},
} satisfies Prisma.CleaningTypeConfigSelect;

export const cleaningPersonSelect = {
	id: true,
	name: true,
	sex: true,
	young: true,
	cleaning: true,
	isActive: true,
	isMarried: true,
	familyId: true,
	groupId: true,
	family: { select: { id: true, name: true } },
	group: { select: { id: true, name: true } },
} satisfies Prisma.PersonSelect;

export const cleaningMeetingScheduleSelect = {
	type: true,
	mode: true,
	isActive: true,
	effectiveFrom: true,
	weeklyRules: {
		orderBy: { sortOrder: "asc" },
		select: { weekday: true, time: true, sortOrder: true },
	},
} satisfies Prisma.OrganizationScheduleSelect;

export const cleaningSavedListSelect = {
	id: true,
	cleaningType: true,
	periodFrom: true,
	periodTo: true,
	status: true,
	createdAt: true,
	dates: {
		orderBy: { date: "asc" },
		select: {
			id: true,
			date: true,
			assignments: {
				orderBy: [{ sector: { sortOrder: "asc" } }, { position: "asc" }],
				select: {
					id: true,
					position: true,
					sector: {
						select: { id: true, name: true, sortOrder: true },
					},
					person: { select: { id: true, name: true } },
					family: { select: { id: true, name: true } },
					group: { select: { id: true, name: true } },
				},
			},
		},
	},
} satisfies Prisma.CleaningAssignmentListSelect;
