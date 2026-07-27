---
name: AssignmentHub
description: Plataforma inteligente para coordenação de congregações
colors:
  almost-black: "oklch(0.145 0 0)"
  pure-white: "oklch(1 0 0)"
  cloud: "oklch(0.97 0 0)"
  stone: "oklch(0.922 0 0)"
  smoke: "oklch(0.556 0 0)"
  ember: "oklch(0.577 0.245 27.325)"
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
    backgroundColor: "{colors.almost-black}"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.4xl}"
    padding: "12px 16px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "color-mix(in oklch, {colors.almost-black}, transparent 20%)"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.almost-black}"
    rounded: "{rounded.4xl}"
    padding: "12px 16px"
    border: "1px solid {colors.stone}"
    typography: "{typography.label}"
  button-outline-hover:
    backgroundColor: "{colors.cloud}"
  card-default:
    backgroundColor: "{colors.pure-white}"
    rounded: "{rounded.4xl}"
    padding: "24px"
    shadow: "0 4px 6px -1px rgb(0 0 0 / 10%), 0 2px 4px -2px rgb(0 0 0 / 10%)"
  input-default:
    backgroundColor: "color-mix(in oklch, {colors.stone}, transparent 50%)"
    rounded: "{rounded.3xl}"
    padding: "4px 12px"
    border: "1px solid transparent"
    typography: "{typography.body}"
  input-focus:
    border: "1px solid {colors.stone}"
    ring: "0 0 0 3px color-mix(in oklch, {colors.stone}, transparent 70%)"
  badge-default:
    backgroundColor: "{colors.almost-black}"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.3xl}"
    padding: "0 8px"
    typography: "{typography.label}"
---

# Design System: AssignmentHub

## Overview

**Creative North Star: "A Estante Organizada"**

AssignmentHub's visual language is built on the metaphor of a well-organized shelf — everything has its rightful place, surfaces are clean and uncluttered, and finding what you need is effortless. The interface recedes so the data can lead.

The palette is intentionally restrained: a near-monochrome scale of charcoal, white, and warm grays, with a single accent of deep blue appearing in dark-mode sidebar navigation and a clear red reserved exclusively for destructive actions. This restraint is by design — elders manage sensitive congregation data, and the interface should communicate sobriety, trust, and clarity without visual noise.

Cards float on soft shadows (`shadow-md`), creating a subtle sense of depth that distinguishes surfaces without competing for attention. Every corner is generously rounded (`rounded-4xl` at 26px maximum), giving the UI a friendly, approachable feel that balances the gravity of the subject matter.

**Key Characteristics:**
- Generous rounded corners (26px max) create a soft, approachable silhouette
- Near-monochrome palette keeps visual noise low; color carries meaning (blue = navigation, red = destructive)
- Soft shadows provide depth without drama
- Consistent 4px spacing grid with 24px as the primary rhythm
- Modern, clear, and welcoming — not cold or clinical

## Colors

The palette is deliberately neutral. Color is used sparingly and carries semantic weight.

### Primary
- **Almost Black** (`oklch(0.145 0 0)`): Primary text, button backgrounds, and active sidebar text (inverted). The foundational contrast color.

### Neutral
- **Pure White** (`oklch(1 0 0)`): Page and card backgrounds. The canvas color.
- **Cloud** (`oklch(0.97 0 0)`): Secondary backgrounds, muted surface, hover states for outline buttons and sidebar items.
- **Stone** (`oklch(0.922 0 0)`): Borders, dividers, and input backgrounds (at 50% opacity). Subtle structural lines.
- **Smoke** (`oklch(0.556 0 0)`): Muted text, secondary labels, placeholder text. Readable but unobtrusive.

### Accent (Dark Mode Only)
- **Twilight Blue** (`oklch(0.488 0.243 264.376)`): Dark-mode sidebar primary indicator. The only chromatic accent in the system; it signals active state without breaking the neutral discipline.

### Semantic
- **Ember** (`oklch(0.577 0.245 27.325)`): Destructive actions, error states, validation alerts. Used against destructive-foreground (`#ffffff`).

### Named Rules
**The Neutral-Discipline Rule.** Color appears only when it carries meaning. Backgrounds, borders, and text are grayscale by default; chromatic color is reserved for navigation state (blue) and destructive actions (red). Adding color for decoration violates the system's contract.

## Typography

**Display Font:** Inter (with `ui-sans-serif, system-ui, sans-serif` fallback)
**Body Font:** Inter
**Label Font:** Inter

**Character:** Clean, highly legible, and slightly compact — Inter's tall x-height and open apertures make small text readable at 14px body size. The pairing is intentionally a single family; no contrast between display and body means the hierarchy comes purely from weight, size, and spacing, not from font switching.

### Hierarchy
- **Display** (Semi Bold 600, `clamp(1.5rem, 4vw, 2.25rem)`, 1.2): Page titles and section headers. Scales with viewport.
- **Headline** (Semi Bold 600, 1.25rem, 1.3): Card titles and dialog headings.
- **Title** (Semi Bold 600, 1rem, 1.4): Section headings inside cards, sidebar item labels.
- **Body** (Regular 400, 0.875rem, 1.5): Primary reading text, table cells, form labels. The default text size.
- **Label** (Medium 500, 0.75rem, 1.25, 0.025em letter-spacing): Badge text, timestamps, metadata, uppercase category labels.

### Named Rules
**The Single-Family Rule.** Inter is used throughout. No secondary font family. Hierarchy is expressed through weight, size, and spacing alone.

## Layout

The app uses a three-tier responsive layout: mobile (single column with drawer navigation), tablet (sidebar visible + content), and desktop (sidebar + header + content).

- **Sidebar**: 260px (approximate), hidden below `lg` (1024px), sticky to viewport top on desktop
- **Header**: Full width, visible above `lg`, supports search bar and user controls
- **Content**: Max-width `--spacing(7)` (80rem = 1280px) centered, with responsive padding
- **Spacing rhythm**: 24px (`--spacing(6)`) is the primary card and section gap. 16px (`--spacing(4)`) is used for compact variants. 32px (`--spacing(8)`) for major section separation.
- **Card padding**: 24px default, 16px for `sm` variant
- **Print**: Header and navigation hidden; content takes full width with zero padding

## Elevation & Depth

The system uses soft shadows to create a gentle elevation hierarchy. Depth is communicated through layered shadows and ring borders, not through tonal color shifts.

### Shadow Vocabulary
- **Card Rest** (`0 4px 6px -1px rgb(0 0 0 / 10%), 0 2px 4px -2px rgb(0 0 0 / 10%)` — Tailwind `shadow-md`): Default card elevation. Surfaces at rest.
- **Dialog/Modal** (`0 20px 25px -5px rgb(0 0 0 / 10%), 0 8px 10px -6px rgb(0 0 0 / 10%)` — Tailwind `shadow-xl`): Modal dialogs and popovers. The highest elevation in the system.
- **Ring** (`0 0 0 1px oklch(0.922 0 0)` — `ring-1 ring-foreground/5`): Subtle edge definition on cards, preventing shadow from floating disconnected.

### Named Rules
**The Soft-Rest Rule.** Surfaces sit at rest with a soft shadow. Shadows darken only at modal elevation. Hover states use background tint (`hover:bg-muted`), not shadow changes.

## Shapes

The system is defined by its generous corner radius. Every surface is rounded, from buttons to cards to dialogs, creating a cohesive and friendly silhouette.

- **Cards & Dialogs**: `rounded-4xl` (26px) — maximum radius; defines the system's character
- **Inputs & Badges**: `rounded-3xl` (22px) — pill-like but not fully circular
- **Small tags/chips**: `rounded-3xl` (22px) — consistent with inputs
- **Buttons**: `rounded-4xl` (26px) — matches card radius for visual harmony
- **Sidebar items**: `rounded-lg` (10px) — smaller radius for dense navigation

Borders are thin (1px) and subdued (`oklch(0.922 0 0)`), using `ring-1 ring-foreground/5` for card edges to integrate shadow with surface.

## Components

### Buttons
- **Shape:** Generously rounded (26px, `rounded-4xl`). Full height for touch targets.
- **Primary (`bg-primary text-primary-foreground`):** Almost-black background, white text. The workhorse button. Hover reduces opacity to 80%. Active state pushes down 1px (`translate-y-px`).
- **Outline (`border-border bg-background hover:bg-muted`):** Transparent with a stone border. Hover fills with cloud background. Used for secondary and "Trocar" actions.
- **Secondary (`bg-secondary text-secondary-foreground`):** Cloud background with almost-black text. Hover subtly darkens. For grouped actions.
- **Ghost (`hover:bg-muted`):** No border or fill at rest. Hover reveals cloud background. For toolbar icons and dialog close buttons.
- **Destructive (`bg-destructive/10 text-destructive`):** Red tint at rest, stronger on hover. Reserved for irreversible actions.
- **Link (`text-primary underline-offset-4 hover:underline`):** Text styled as a link. For inline navigation.
- **States:** Focus-visible shows ring (`focus-visible:ring-3 focus-visible:ring-ring/30`). Disabled reduces opacity to 50% and removes pointer events. Invalid shows destructive ring.

### Cards
- **Corner Style:** Maximum radius (26px, `rounded-4xl`)
- **Background:** Pure white (`bg-card`)
- **Shadow Strategy:** `shadow-md` + `ring-1 ring-foreground/5` (see Elevation)
- **Internal Padding:** 24px (`--card-spacing: --spacing(6)`), 16px for `sm` variant
- **Header:** Auto-grid with optional action column. Title uses `font-heading text-base font-medium`.
- **Footer:** Flex row with `rounded-b-4xl` to match parent corners.

### Inputs / Fields
- **Shape:** Pill-like (22px, `rounded-3xl`). Height 36px (`h-9`).
- **Style:** Transparent border at rest, stone background at 50% opacity (`bg-input/50`). Placeholder text in smoke.
- **Focus:** Border shifts to stone, ring appears (`focus-visible:ring-3 focus-visible:ring-ring/30`). Transition on color, box-shadow, and background-color.
- **Disabled:** 50% opacity, no pointer events.
- **Invalid:** Destructive border and ring.

### Badges
- **Shape:** Compact pill (22px, `rounded-3xl`), height 20px (`h-5`), `text-xs` font.
- **Default:** Almost-black background, white text.
- **Secondary:** Cloud background, almost-black text.
- **Outline:** Transparent with stone border, full-opacity text.
- **Destructive:** Red tint background, red text.

### Navigation (Sidebar)
- **Style:** Vertical stack with chevron indicators. Icons at 16px.
- **Default state:** Smoke text, no background. Hover fills cloud.
- **Active state:** Almost-black background, white text — inverts the default. No icon change; the background switch is sufficient.
- **Spacing:** `px-3 py-2.5` per item, `gap-1` between items.
- **Mobile:** Replaced by a Sheet drawer with the same link structure.

### Dialogs
- **Shape:** Maximum radius (26px, `rounded-4xl`), 32px padding, `shadow-xl`, `ring-1 ring-foreground/5`.
- **Overlay:** Black at 30% opacity, `backdrop-blur-sm` when supported. Fade-in animation.
- **Content:** Centered with zoom-in/zoom-out animation (`data-open:zoom-in-95`, `data-closed:zoom-out-95`).
- **Title:** Uses `font-heading text-base font-medium`.
- **Close button:** Ghost variant, positioned top-right, sits on a cloud background circle.

## Do's and Don'ts

### Do:
- **Do** use the full 26px radius (`rounded-4xl`) on cards, dialogs, and buttons — it defines the system
- **Do** keep the palette neutral; let content carry the visual weight
- **Do** use `shadow-md` for card elevation and `shadow-xl` only for modals
- **Do** use `ring-1 ring-foreground/5` to anchor shadow edges
- **Do** use `hover:bg-muted` for interactive surface feedback
- **Do** use `transition-colors duration-200` on interactive elements

### Don't:
- **Don't** add chromatic color for decoration — color is semantic only
- **Don't** use `shadow-lg` or `shadow-2xl` — the system has only two shadow levels
- **Don't** mix border-radius strategies — all surfaces use the same family
- **Don't** place text larger than 14px (`text-sm`) in body content without a hierarchy reason
- **Don't** add font families beyond Inter
