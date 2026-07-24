type Props = {
	title?: string;
	subtitle?: string;
};

export function MeetingContentHeader({
	title = "Conteúdo das reuniões",
	subtitle = "Catálogo global compartilhado entre as congregações",
}: Props) {
	return (
		<header className="overflow-hidden rounded-[28px] bg-linear-to-br from-blue-600 via-blue-700 to-violet-700 p-5 text-white shadow-xl shadow-blue-600/20 sm:p-6">
			<p className="text-xs font-semibold tracking-[0.14em] text-blue-100 uppercase">
				AssignmentHub
			</p>
			<h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
				{title}
			</h1>
			<p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-50/90 sm:text-base">
				{subtitle}
			</p>
		</header>
	);
}
