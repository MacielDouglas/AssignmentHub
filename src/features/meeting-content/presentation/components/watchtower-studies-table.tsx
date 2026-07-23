"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { HiOutlineBookOpen, HiOutlineTrash } from "react-icons/hi2";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WatchtowerStudyEntity } from "@/features/meeting-content/domain/entities/watchtower-study";
import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";
import { contentLocaleLabel } from "@/features/meeting-content/domain/values-objects/content-locale";

import {
  deleteAllWatchtowerStudiesAction,
  deleteWatchtowerStudiesAction,
} from "../actions/watchtower.actions";
import { ContentBadge } from "./content-badge";
import { WatchtowerEditStudyDialog } from "./watchtower-edit-study-dialog";

type Props = {
  slug: string;
  canManage: boolean;
  studies: WatchtowerStudyEntity[];
  /** Opcional — se não vier, a tabela filtra sozinha */
  filterLocale?: ContentLocale;
  counts?: { locale: ContentLocale; count: number }[];
};

export function WatchtowerStudiesTable({
  slug,
  canManage,
  studies,
  filterLocale: filterLocaleProp,
}: Props) {
  const router = useRouter();
  const [internalLocale, setInternalLocale] = useState<ContentLocale>(
    filterLocaleProp ?? "es",
  );
  const filterLocale = filterLocaleProp ?? internalLocale;

  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () => studies.filter((item) => item.locale === filterLocale),
    [studies, filterLocale],
  );

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((item) => selected.has(item.id));

  function toggle(id: string, value: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAllVisible(value: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);

      for (const item of filtered) {
        if (value) next.add(item.id);
        else next.delete(item.id);
      }

      return next;
    });
  }

  function deleteSelected() {
    setError(null);

    startTransition(async () => {
      const result = await deleteWatchtowerStudiesAction(slug, [...selected]);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSelected(new Set());
      router.refresh();
    });
  }

  function deleteAll() {
    setError(null);

    startTransition(async () => {
      const result = await deleteAllWatchtowerStudiesAction(slug, filterLocale);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <section
      aria-labelledby="wt-catalog-title"
      className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <header className="space-y-1">
          <h2
            id="wt-catalog-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-50"
          >
            Estudos salvos
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {contentLocaleLabel(filterLocale)} · {filtered.length} registro(s)
          </p>
        </header>

        <div className="flex w-full max-w-xs flex-col gap-2 sm:w-auto">
          <Label htmlFor="filter-locale">Filtrar catálogo</Label>
          <Select
            value={filterLocale}
            onValueChange={(value) => {
              if (!filterLocaleProp) {
                setInternalLocale(value as ContentLocale);
              }
              setSelected(new Set());
            }}
            disabled={Boolean(filterLocaleProp)}
          >
            <SelectTrigger id="filter-locale" className="h-11 rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="pt">Português</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {canManage ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {filtered.length > 0 ? (
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 dark:border-slate-800">
              <Checkbox
                id="select-all-studies"
                checked={allVisibleSelected}
                onCheckedChange={(value) => toggleAllVisible(Boolean(value))}
                disabled={pending}
              />
              <Label
                htmlFor="select-all-studies"
                className="cursor-pointer text-sm font-normal"
              >
                Selecionar todos
              </Label>
            </div>
          ) : null}

          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-2xl"
            disabled={pending || selected.size === 0}
            onClick={deleteSelected}
          >
            <HiOutlineTrash className="mr-2 h-4 w-4" />
            Remover selecionados
            {selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                className="h-11 rounded-2xl"
                disabled={pending || filtered.length === 0}
              >
                Remover todos ({filterLocale})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[28px]">
              <AlertDialogHeader>
                <AlertDialogTitle>Remover todos os estudos?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso apaga permanentemente todos os estudos em{" "}
                  {contentLocaleLabel(filterLocale)}. Esta ação não pode ser
                  desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-2xl">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction className="rounded-2xl" onClick={deleteAll}>
                  Confirmar exclusão
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {filtered.length === 0 ? (
        <article className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
            <HiOutlineBookOpen className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Nenhum estudo cadastrado
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Importe um arquivo .jwpub de A Sentinela / La Atalaya para começar.
          </p>
        </article>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((study) => {
            const checked = selected.has(study.id);

            return (
              <li key={study.id}>
                <article className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-4 shadow-sm transition hover:border-blue-200 hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-blue-900 dark:hover:bg-slate-950 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    {canManage ? (
                      <div className="pt-1">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            toggle(study.id, Boolean(value))
                          }
                          aria-label={`Selecionar ${study.title}`}
                          disabled={pending}
                        />
                      </div>
                    ) : null}

                    <div className="min-w-0 flex-1 space-y-3">
                      <header className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-3">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-blue-600/20"
                            style={{
                              background: study.highlightColor
                                ? study.highlightColor
                                : "linear-gradient(to bottom right, #2563EB, #7C3AED)",
                            }}
                            aria-hidden
                          >
                            <HiOutlineBookOpen className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                              {study.title}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {study.weekLabelRaw ??
                                `${study.weekStart} → ${study.weekEnd}`}
                            </p>
                          </div>
                        </div>

                        {canManage ? (
                          <div className="shrink-0">
                            <WatchtowerEditStudyDialog
                              slug={slug}
                              study={study}
                              disabled={pending}
                            />
                          </div>
                        ) : null}
                      </header>

                      <div className="flex flex-wrap gap-2">
                        <ContentBadge
                          label={`${study.weekStart} → ${study.weekEnd}`}
                          tone="blue"
                        />
                        <ContentBadge
                          label={`Cânticos ${study.openingSongNum} / ${study.closingSongNum}`}
                          tone="violet"
                        />
                        {study.issueCode ? (
                          <ContentBadge label={study.issueCode} />
                        ) : null}
                        {study.highlightColor ? (
                          <ContentBadge label={study.highlightColor} />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
