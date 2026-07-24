import type { ReactNode } from "react";

type Props = {
	title: string;
	description: string;
	badge?: string;
	children?: ReactNode;
};

export function MeetingContentSectionStub({
	title,
	description,
	badge,
	children,
}: Props) {
	return (
		<section
			aria-labelledby="section-stub-title"
			className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6"
		>
			<div className="space-y-2">
				{badge ? (
					<p className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 uppercase dark:bg-blue-950/50 dark:text-blue-300">
						{badge}
					</p>
				) : null}

				<h2
					id="section-stub-title"
					className="text-xl font-semibold text-slate-900 dark:text-slate-50"
				>
					{title}
				</h2>

				<p className="max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
					{description}
				</p>
			</div>

			<div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center dark:border-slate-700 dark:bg-slate-900 sm:px-6">
				<p className="text-sm font-medium text-slate-700 dark:text-slate-200">
					Em construção
				</p>
				<p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
					A importação, revisão e listagem desta seção serão conectadas na
					próxima etapa.
				</p>
				{children}
			</div>
		</section>
	);
}
