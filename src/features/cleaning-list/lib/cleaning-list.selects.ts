export const cleaningConfigSelect = {
	id: true,
	type: true,
	enabled: true,
	assignmentMode: true,
	notes: true,
	timesPerWeek: true,
	weekdays: {
		orderBy: {
			sortOrder: "asc" as const,
		},
		select: {
			id: true,
			weekday: true,
			sortOrder: true,
		},
	},
	dates: {
		orderBy: {
			date: "asc" as const,
		},
		select: {
			id: true,
			date: true,
			label: true,
		},
	},
	sectors: {
		where: {
			isActive: true,
		},
		orderBy: {
			sortOrder: "asc" as const,
		},
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
};

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
	family: {
		select: {
			id: true,
			name: true,
		},
	},
	group: {
		select: {
			id: true,
			name: true,
		},
	},
};

export const cleaningScheduleSelect = {
	type: true,
	mode: true,
	weeklyRules: {
		orderBy: {
			sortOrder: "asc" as const,
		},
		select: {
			weekday: true,
		},
	},
	occurrences: {
		orderBy: {
			startDate: "asc" as const,
		},
		select: {
			startDate: true,
		},
	},
};

export const cleaningSavedListSelect = {
	id: true,
	cleaningType: true,
	periodFrom: true,
	periodTo: true,
	status: true,
	createdAt: true,
	dates: {
		orderBy: {
			date: "asc" as const,
		},
		select: {
			id: true,
			date: true,
			assignments: {
				orderBy: [
					{ sector: { sortOrder: "asc" as const } },
					{ position: "asc" as const },
				],
				select: {
					id: true,
					position: true,
					sector: {
						select: {
							id: true,
							name: true,
							sortOrder: true,
						},
					},
					person: {
						select: {
							id: true,
							name: true,
						},
					},
					family: {
						select: {
							id: true,
							name: true,
						},
					},
					group: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			},
		},
	},
};
