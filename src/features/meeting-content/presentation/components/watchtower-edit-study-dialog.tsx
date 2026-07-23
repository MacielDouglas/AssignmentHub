"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, X } from "lucide-react";

import type { WatchtowerStudyEntity } from "@/features/meeting-content/domain/entities/watchtower-study";
import { updateWatchtowerStudyAction } from "@/features/meeting-content/presentation/actions/watchtower.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  slug: string;
  study: WatchtowerStudyEntity;
  disabled?: boolean;
};

type FormState = {
  locale: "pt" | "es";
  weekLabelRaw: string;
  weekStart: string;
  weekEnd: string;
  title: string;
  openingSong: string;
  closingSong: string;
  highlightColor: string;
  issueCode: string;
};

function toFormState(study: WatchtowerStudyEntity): FormState {
  return {
    locale: study.locale,
    weekLabelRaw: study.weekLabelRaw ?? "",
    weekStart: study.weekStart,
    weekEnd: study.weekEnd,
    title: study.title,
    openingSong: String(study.openingSongNum),
    closingSong: String(study.closingSongNum),
    highlightColor: study.highlightColor ?? "",
    issueCode: study.issueCode ?? "",
  };
}

function validIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function normalizeColor(value: string): string | null {
  const color = value.trim();
  if (!color) return null;
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color.toUpperCase();
  if (/^[0-9A-Fa-f]{6}$/.test(color)) return `#${color.toUpperCase()}`;
  return null;
}

export function WatchtowerEditStudyDialog({
  slug,
  study,
  disabled = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => toFormState(study));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const colorPreview = useMemo(
    () => normalizeColor(form.highlightColor) ?? "#64748B",
    [form.highlightColor],
  );

  function openDialog() {
    setForm(toFormState(study));
    setError(null);
    setOpen(true);
  }

  function closeDialog() {
    setOpen(false);
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      openDialog();
      return;
    }
    closeDialog();
  }

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function save() {
    setError(null);

    const openingSong = Number(form.openingSong);
    const closingSong = Number(form.closingSong);
    const highlightColor = normalizeColor(form.highlightColor);

    if (!form.title.trim()) {
      setError("Informe o título do estudo.");
      return;
    }

    if (!form.weekLabelRaw.trim()) {
      setError("Informe o rótulo original da semana.");
      return;
    }

    if (!validIsoDate(form.weekStart)) {
      setError("A data de início deve estar no formato AAAA-MM-DD.");
      return;
    }

    if (!validIsoDate(form.weekEnd)) {
      setError("A data final deve estar no formato AAAA-MM-DD.");
      return;
    }

    if (
      !Number.isInteger(openingSong) ||
      openingSong < 1 ||
      openingSong > 999
    ) {
      setError("O cântico inicial deve ser um número entre 1 e 999.");
      return;
    }

    if (
      !Number.isInteger(closingSong) ||
      closingSong < 1 ||
      closingSong > 999
    ) {
      setError("O cântico final deve ser um número entre 1 e 999.");
      return;
    }

    if (form.highlightColor.trim() && !highlightColor) {
      setError("A cor deve estar no formato #RRGGBB, por exemplo #D29632.");
      return;
    }

    startTransition(async () => {
      const result = await updateWatchtowerStudyAction(slug, {
        id: study.id,
        locale: form.locale,
        weekLabelRaw: form.weekLabelRaw.trim(),
        weekStart: form.weekStart,
        weekEnd: form.weekEnd,
        title: form.title.trim(),
        openingSong,
        closingSong,
        highlightColor,
        issueCode: form.issueCode.trim() || null,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || isPending}
          className="h-9 gap-2 rounded-xl"
          onClick={(event) => {
            event.preventDefault();
            openDialog();
          }}
        >
          <Pencil className="size-4" />
          Editar
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle>Editar estudo de A Sentinela</DialogTitle>
          <DialogDescription>
            Altere somente este artigo. As alterações serão salvas
            imediatamente no catálogo global.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label htmlFor={`study-title-${study.id}`}>Título</Label>
            <Textarea
              id={`study-title-${study.id}`}
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              className="min-h-20 rounded-2xl"
              maxLength={500}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`study-label-${study.id}`}>
              Rótulo original da semana
            </Label>
            <Input
              id={`study-label-${study.id}`}
              value={form.weekLabelRaw}
              onChange={(event) =>
                updateField("weekLabelRaw", event.target.value)
              }
              className="rounded-xl"
              maxLength={200}
              placeholder="28 DE SEPTIEMBRE-4 DE OCTUBRE DE 2026"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`study-start-${study.id}`}>
                Início (segunda-feira)
              </Label>
              <Input
                id={`study-start-${study.id}`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="2026-09-28"
                maxLength={10}
                value={form.weekStart}
                onChange={(event) =>
                  updateField(
                    "weekStart",
                    event.target.value.replace(/[^\d-]/g, "").slice(0, 10),
                  )
                }
                className="rounded-xl font-mono"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`study-end-${study.id}`}>Fim (domingo)</Label>
              <Input
                id={`study-end-${study.id}`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="2026-10-04"
                maxLength={10}
                value={form.weekEnd}
                onChange={(event) =>
                  updateField(
                    "weekEnd",
                    event.target.value.replace(/[^\d-]/g, "").slice(0, 10),
                  )
                }
                className="rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`study-opening-song-${study.id}`}>
                Cântico inicial
              </Label>
              <Input
                id={`study-opening-song-${study.id}`}
                type="number"
                min={1}
                max={999}
                value={form.openingSong}
                onChange={(event) =>
                  updateField("openingSong", event.target.value)
                }
                className="rounded-xl"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`study-closing-song-${study.id}`}>
                Cântico final
              </Label>
              <Input
                id={`study-closing-song-${study.id}`}
                type="number"
                min={1}
                max={999}
                value={form.closingSong}
                onChange={(event) =>
                  updateField("closingSong", event.target.value)
                }
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
            <div className="grid gap-2">
              <Label htmlFor={`study-color-${study.id}`}>
                Cor de destaque
              </Label>
              <Input
                id={`study-color-${study.id}`}
                value={form.highlightColor}
                onChange={(event) =>
                  updateField("highlightColor", event.target.value)
                }
                className="rounded-xl font-mono"
                maxLength={7}
                placeholder="#D29632"
              />
            </div>

            <div className="grid gap-2">
              <Label>Prévia</Label>
              <div
                className="h-10 w-full min-w-20 rounded-xl border shadow-sm sm:w-20"
                style={{ backgroundColor: colorPreview }}
                aria-label={`Cor selecionada: ${colorPreview}`}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`study-issue-${study.id}`}>
              Código da revista
            </Label>
            <Input
              id={`study-issue-${study.id}`}
              value={form.issueCode}
              onChange={(event) =>
                updateField("issueCode", event.target.value)
              }
              className="rounded-xl font-mono"
              maxLength={64}
              placeholder="w26.07-S"
            />
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300"
            >
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={isPending}
            onClick={closeDialog}
          >
            <X className="size-4" />
            Cancelar
          </Button>

          <Button
            type="button"
            className="gap-2 rounded-xl"
            disabled={isPending}
            onClick={save}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
