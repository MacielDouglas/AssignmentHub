---
name: AssignmentHub
description: Plataforma inteligente para coordenação de congregações
colors:
  tech-blue: "oklch(0.545 0.202 265)"
  tech-blue-foreground: "#ffffff"
  almost-black: "oklch(0.13 0.015 255)"
  pure-white: "oklch(1 0 0)"
  warm-bg: "oklch(0.985 0.003 65)"
  warm-muted: "oklch(0.96 0.006 65)"
  warm-secondary: "oklch(0.95 0.008 65)"
  warm-border: "oklch(0.91 0.006 65)"
  warm-smoke: "oklch(0.5 0.015 255)"
  ember: "oklch(0.55 0.22 30)"
  ember-foreground: "#ffffff"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 4vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.2
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "0.025em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "18px"
  3xl: "22px"
  4xl: "26px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.tech-blue}"
    textColor: "{colors.tech-blue-foreground}"
    rounded: "{rounded.4xl}"
    padding: "12px 16px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "color-mix(in oklch, {colors.tech-blue}, black 15%)"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.almost-black}"
    rounded: "{rounded.4xl}"
    padding: "12px 16px"
    border: "1px solid {colors.warm-border}"
    typography: "{typography.label}"
  button-outline-hover:
    backgroundColor: "{colors.warm-secondary}"
  card-default:
    backgroundColor: "{colors.pure-white}"
    rounded: "{rounded.4xl}"
    padding: "24px"
    shadow: "0 4px 6px -1px rgb(0 0 0 / 10%), 0 2px 4px -2px rgb(0 0 0 / 10%)"
  input-default:
    backgroundColor: "{colors.warm-border}"
    rounded: "{rounded.3xl}"
    padding: "4px 12px"
    border: "1px solid transparent"
    typography: "{typography.body}"
  input-focus:
    border: "1px solid {colors.tech-blue}"
    ring: "0 0 0 3px color-mix(in oklch, {colors.tech-blue}, transparent 70%)"
  badge-default:
    backgroundColor: "{colors.warm-muted}"
    textColor: "{colors.warm-smoke}"
    rounded: "{rounded.3xl}"
    padding: "0 8px"
    typography: "{typography.label}"
---

# Design System: AssignmentHub

## Overview

**Creative North Star: "Agência Digital"**

AssignmentHub's visual language is inspired by modern digital banking — clean, professional, and welcoming. Every surface communicates trust through restraint: generous whitespace, a single blue accent, and warm neutral tones that soften the digital edge.

The blue (`#2563EB`) is the product's voice — present in every primary action, link, and active indicator. It signals confidence without aggression. The neutral palette leans warm (tinted at hue ~65), so the interface feels like a well-lit bank lobby rather than a cold terminal. Cards float on soft shadows over a subtly warm canvas, creating depth without visual noise.

**Key Characteristics:**
- Warm neutral background (`oklch(0.985 0.003 65)`) — inviting, not clinical
- Tech blue (`#2563EB`) as the single accent — purposeful, confident
- Generous rounded corners (26px max) keep the feel approachable
- Soft shadows provide card elevation without drama
- Clean, restrained — the interface recedes so the data leads

## Colors

The palette builds on warm neutrals with one committed blue accent.

### Primary
- **Tech Blue** (`oklch(0.545 0.202 265)` — `#2563EB`): Primary actions, links, active nav indicators, focus rings. The product's voice.

### Neutral Palette
- **Almost Black** (`oklch(0.13 0.015 255)`): Primary text, high-contrast headings.
- **Pure White** (`oklch(1 0 0)`): Page and card backgrounds. The canvas color for content surfaces.
- **Warm Background** (`oklch(0.985 0.003 65)`): Page-level background. Imperceptibly warm, replaces pure white for a softer feel.
- **Warm Muted** (`oklch(0.96 0.006 65)`): Secondary backgrounds, hover states, subtle surface fills.
- **Warm Secondary** (`oklch(0.95 0.008 65)`): Interactive surface backgrounds, sidebar item hover.
- **Warm Border** (`oklch(0.91 0.006 65)`): Borders, dividers, input backgrounds. Soft structural lines.
- **Warm Smoke** (`oklch(0.5 0.015 255)`): Muted text, secondary labels, placeholder text. Readable but unobtrusive.

### Semantic
- **Ember** (`oklch(0.55 0.22 30)`): Destructive actions, error states, validation alerts. A warm red that harmonizes with the blue palette.

### Named Rules
**The Blue-Accent Rule.** Tech Blue is the only chromatic accent. Primary actions, links, active navigation, and focus indicators use it. Chromatic color outside of Tech Blue and Ember (destructive) is decoration and violates the system's contract.

## Typography

**Face:** Inter (with `ui-sans-serif, system-ui, sans-serif` fallback)

A single sans-serif family expresses the full hierarchy through weight, size, tracking, and line height alone. Inter's tall x-height, open apertures, and humanist proportions keep small text legible and large text refined — essential for a data-dense interface that must feel calm.

Inter is loaded via `next/font/google` with the `--font-sans` CSS variable and registered in `@theme` so `font-sans` resolves to the variable. No secondary or display face is used.

### Hierarchy

| Token       | Size    | Weight | Line Height | Letter Spacing | Use                                 |
|-------------|---------|--------|-------------|----------------|-------------------------------------|
| `text-display`  | 2.25rem (36px) | 600 (Semi Bold) | 1.2 | -0.01em | Page titles, major section headers |
| `text-headline` | 1.25rem (20px) | 600 (Semi Bold) | 1.3 | default | Card titles, dialog headings        |
| `text-title`    | 1rem (16px)    | 600 (Semi Bold) | 1.4 | default | Section headings inside cards       |
| `text-body`     | 0.875rem (14px)| 400 (Regular)   | 1.5 | default | Primary reading, table cells, forms |
| `text-body-sm`  | 0.8125rem (13px)| 400 (Regular)  | 1.5 | default | Dense table cells, compact lists    |
| `text-label`    | 0.75rem (12px) | 500 (Medium)    | 1.25 | 0.025em | Badges, timestamps, metadata        |
| `text-caption`  | 0.6875rem (11px)| 450            | 1.25 | default | Footnoted data, non-interactive meta|

All hierarchy tokens are defined in `@theme` and available as Tailwind utility classes (`text-display`, `text-headline`, `text-body`, etc.).

### Scale Rationale

- **Display** uses a tight negative letter-spacing (-0.01em) to reduce rivers at large sizes, a common technique in editorial and banking UIs.
- **Label** uses explicit positive tracking (0.025em) for uppercase segmentation — e.g. `uppercase tracking-wider text-label text-muted-foreground` on category markers.
- **Body** at 14px (0.875rem) is the system's default — warm enough for comfortable reading, compact enough for data density. The 1.5 line height gives generous breathing room.
- **Caption** (11px) is the legibility floor for non-interactive metadata. Interactive text below 11px is prohibited per WCAG and the `impeccable` detector rule.

### Monospace

`font-mono` is defined as `ui-monospace, SFMono-Regular, Cascadia Code, Consolas, monospace` — used exclusively for tabular data, code, and alphanumeric identifiers where character alignment matters. Never for body text.

### Rhythm & Measure

- **Default line-height** for body text is 1.5. Side-by-side cards or data-dense tables may tighten to `leading-snug` (1.375).
- **Optimal measure** targets 60–75 characters per line for body text. Cards at 24px padding with a 448px max-width (dialog) naturally fall within this range.
- **Headings** use tighter line-heights (1.2–1.4) to keep multi-line titles compact and scannable.

### Implementation Notes

- All typography tokens live in `@theme` inside `globals.css` — no custom `@utility` or `@layer` blocks needed.
- The `font-heading` theme alias points to the same variable as `font-sans`; it exists for future optical-size tuning.
- Tabular figures are not yet loaded from Inter's `"tnum"` feature — this is a future enhancement for data tables.

## Layout

The app uses a three-tier responsive layout: mobile (single column with drawer navigation), tablet (sidebar visible + content), and desktop (sidebar + header + content).

- **Sidebar**: 260px (approximate), hidden below `lg` (1024px), sticky to viewport top on desktop. White background for card-like separation from the warm page background.
- **Header**: Full width, visible above `lg`.
- **Content**: Max-width 80rem (1280px) centered, with responsive padding.
- **Spacing rhythm**: 24px primary card/section gap. 16px for compact variants. 32px for major section separation.
- **Card padding**: 24px default, 16px for `sm` variant.

## Elevation & Depth

Soft shadows create gentle elevation. Cards float on the warm background with defined edges.

### Shadow Vocabulary
- **Card Rest** (`shadow-md`): Default card elevation. `ring-1 ring-border` anchors the edge.
- **Dialog/Modal** (`shadow-xl`): Modal dialogs and popovers. The highest elevation.
- **Ring** (`ring-1 ring-border`): Subtle edge definition on cards.

### Named Rules
**The Soft-Rest Rule.** Surfaces sit at rest with a soft shadow and ring. Hover states use background tint, not shadow changes.

## Shapes

Generous corner radius defines the system's silhouette — approachable, not severe.

- **Cards & Dialogs**: `rounded-4xl` (26px) — maximum radius
- **Inputs & Badges**: `rounded-3xl` (22px) — pill-like
- **Buttons**: `rounded-4xl` (26px) — matches card radius
- **Sidebar items**: `rounded-lg` (10px) — compact for dense navigation

## Components

### Buttons
- **Shape:** `rounded-4xl` (26px). Full height for touch targets.
- **Primary (`bg-primary text-primary-foreground`):** Tech Blue background, white text. Hover darkens by 15%. Active state `translate-y-px`.
- **Outline (`border-border bg-background hover:bg-secondary`):** Transparent with warm border. Hover fills with secondary background.
- **Ghost (`hover:bg-muted`):** No border at rest.
- **Destructive (`bg-destructive/10 text-destructive`):** Red tint at rest, stronger on hover.
- **States:** Focus-visible ring in Tech Blue. Disabled at 50% opacity.

### Cards
- **Radius:** `rounded-4xl` (26px)
- **Background:** Pure white (`bg-card`)
- **Shadow:** `shadow-md` + `ring-1 ring-border`
- **Padding:** 24px (16px for `sm` variant)

### Inputs / Fields
- **Radius:** `rounded-3xl` (22px). Height 36px.
- **Style:** Transparent border at rest, warm border at 50% opacity. Focus shifts to Tech Blue ring.
- **Disabled:** 50% opacity. **Invalid:** Destructive border and ring.

### Navigation (Sidebar)
- **Background:** White — separates from the warm page background like a bank's main menu panel.
- **Default:** Smoke text, no background. Hover fills secondary.
- **Active:** Tech Blue background, white text.
- **Icons at 16px**, `px-3 py-2.5` spacing.

### Dialogs
- **Radius:** `rounded-4xl` (26px), 32px padding, `shadow-xl`, `ring-1 ring-border`.
- **Overlay:** Black at 30% opacity, `backdrop-blur-sm`. Zoom-in animation.

## Do's and Don'ts

### Do:
- **Do** use Tech Blue for primary actions, links, and active indicators
- **Do** keep the palette warm-neutral; the blue accent carries the brand
- **Do** use `shadow-md + ring-1 ring-border` on cards
- **Do** use the full 26px radius on cards, dialogs, and buttons
- **Do** use `hover:bg-muted` or `hover:bg-secondary` for interactive feedback

### Don't:
- **Don't** add chromatic color beyond Tech Blue and Ember (destructive)
- **Don't** use decorative color — the blue accent earns its place through purpose
- **Don't** use `shadow-lg` or `shadow-2xl` — only `shadow-md` and `shadow-xl`
- **Don't** mix neutral temperatures — keep the warm tint consistent
- **Don't** place text larger than 14px in body content without a hierarchy reason
