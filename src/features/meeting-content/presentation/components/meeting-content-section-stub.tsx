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
			className="space-y-4 rounded-4xl border border-border bg-card p-5 shadow-sm sm:p-6"
		>
			<div className="space-y-2">
				{badge ? (
					<p className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-label uppercase text-primary">
						{badge}
					</p>
				) : null}

				<h2 id="section-stub-title" className="text-headline text-foreground">
					{title}
				</h2>

				<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
					{description}
				</p>
			</div>

			<div className="rounded-3xl border border-dashed border-border bg-muted px-4 py-10 text-center sm:px-6">
				<p className="text-sm font-medium text-foreground">Em construção</p>
				<p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
					A importação, revisão e listagem desta seção serão conectadas na
					próxima etapa.
				</p>
				{children}
			</div>
		</section>
	);
}
