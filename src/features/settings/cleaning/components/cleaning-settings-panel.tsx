import { CleaningTypeCard } from "@/features/settings/cleaning/components/cleaning-type-card";
import type { CleaningSettingsView } from "@/features/settings/cleaning/lib/cleaning-settings";

type Props = {
	organizationSlug: string;
	canEdit: boolean;
	cleaning: CleaningSettingsView;
};

export function CleaningSettingsPanel({
	organizationSlug,
	canEdit,
	cleaning,
}: Props) {
	return (
		<div className="space-y-6">
			<div className="rounded-[24px] border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
				Configure os três tipos de limpeza. Setores padrão são criados na
				primeira visita; você pode editar, desativar ou restaurar os que
				faltarem. Designações de pessoas/famílias/grupos ficam na tela de
				designações.
			</div>

			{cleaning.types.map((typeView) => (
				<CleaningTypeCard
					key={typeView.type}
					organizationSlug={organizationSlug}
					canEdit={canEdit}
					typeView={typeView}
				/>
			))}
		</div>
	);
}
