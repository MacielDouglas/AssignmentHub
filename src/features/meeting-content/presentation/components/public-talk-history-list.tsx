type HistoryItem = {
	id: string;
	performedAt: Date;
	speakerNameSnapshot: string;
	notes: string | null;
	speakerPersonId: string | null;
	speakerSubPersonId: string | null;
	speakerPerson: { id: string; name: string } | null;
	speakerSubPerson: {
		id: string;
		name: string;
		subOrganization?: { name: string };
		subOrganizationName?: string;
	} | null;
};

type PublicTalkHistoryListProps = {
	history: HistoryItem[];
};

function formatDate(date: Date) {
	return new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "medium",
	}).format(new Date(date));
}

function resolveSpeaker(history: HistoryItem) {
	if (history.speakerPersonId && history.speakerPerson) {
		return history.speakerPerson.name;
	}

	if (history.speakerSubPersonId && history.speakerSubPerson) {
		const orgName =
			history.speakerSubPerson.subOrganization?.name ??
			history.speakerSubPerson.subOrganizationName;

		return orgName
			? `${history.speakerSubPerson.name} · ${orgName}`
			: history.speakerSubPerson.name;
	}

	return "Usuário anônimo";
}

export function PublicTalkHistoryList({ history }: PublicTalkHistoryListProps) {
	if (history.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
				Ainda não há histórico para este discurso nesta organização.
			</div>
		);
	}

	return (
		<ul className="space-y-3">
			{history.map((item) => (
				<li
					key={item.id}
					className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
				>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
						<div className="space-y-1">
							<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
								{resolveSpeaker(item)}
							</p>
							<p className="text-xs text-slate-500 dark:text-slate-400">
								{formatDate(item.performedAt)}
							</p>
						</div>

						<span className="inline-flex min-h-8 items-center rounded-full bg-slate-200 px-3 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
							Histórico
						</span>
					</div>

					{item.notes ? (
						<p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
							{item.notes}
						</p>
					) : null}
				</li>
			))}
		</ul>
	);
}
