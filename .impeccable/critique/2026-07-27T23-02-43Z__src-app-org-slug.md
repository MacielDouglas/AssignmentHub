---
target: Main pages (org layout, dashboard, people, groups, meetings)
total_score: 17
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
p2_count: 3
timestamp: 2026-07-27T23-02-43Z
slug: src-app-org-slug
---
# Design Critique: AssignmentHub Main Pages

**Target**: src/app/org/[slug]/ (org layout, dashboard, people, groups, meetings pages)

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Dashboard uses placeholder text ("Aqui entrarão dados reais"), no loading/empty state guidance |
| 2 | Match System / Real World | 3 | Domain terms in Portuguese are good, but developer copy leaks into user-facing UI |
| 3 | User Control and Freedom | 3 | Sidebar nav has clear back navigation, but no visible undo for assignment/delete actions |
| 4 | Consistency and Standards | 1 | Four different border-radius strategies across pages; raw Tailwind grays mixed with semantic tokens; dashboard cards have zero radius while meetings uses rounded-2xl |
| 5 | Error Prevention | 2 | Role-based hiding is good, but "Privilégios de Serviço" label only counts one flag — misleading |
| 6 | Recognition Rather Than Recall | 2 | 9 sidebar items exceeds working memory; up to 7+ badges per person card forces visual scanning |
| 7 | Flexibility and Efficiency | 1 | No keyboard shortcuts, no bulk operations, every edit requires a modal |
| 8 | Aesthetic and Minimalist Design | 1 | Decorative gradients, colored icon backgrounds, hardcoded hex section colors — violates the Neutral-Discipline Rule |
| 9 | Error Recovery | 1 | No undo for destructive actions, no toast/confirmation feedback in page code |
| 10 | Help and Documentation | 1 | No contextual help, no onboarding, no tooltips for non-tech-savvy elders |
| **Total** | | **17/40** | **Poor — major UX overhaul required** |

## Design Specificity Verdict

**LLM Assessment**: The interface is category-interchangeable with a generic SaaS admin panel. Nothing in the visual language — gradients, colored icon circles, badge systems — signals "congregation management for Jehovah's Witnesses elders." The purple-blue gradient hero sections could belong to any B2B dashboard. The "A Estante Organizada" north star — a monochrome, restrained, serene shelf metaphor — is contradicted by decorative gradients, colorful badge systems, and hardcoded hex section colors. The product character (trust, quiet authority, fairness) is absent from the visual execution — only the Portuguese domain copy carries any specificity.

**Deterministic Scan (Detector)**: 13 findings across meetings components — all `design-system-font-size` violations (10px/11px fonts below the 12px Label minimum). Additionally, a token mismatch was found: `--primary` is `oklch(0.205 0 0)` in `globals.css` but DESIGN.md defines almost-black/primary as `oklch(0.145 0 0)`. Component-level analysis confirmed the dashboard stat cards have no border-radius (violating the mandatory rounded-4xl), use decorative chromatic icon backgrounds (`bg-blue-50`, `bg-violet-50`, `bg-slate-100`), and lack `shadow-md`. The org-header search input uses `rounded-lg` (10px) instead of `rounded-3xl` (22px) as specified. The org-sidebar is correct — the only component fully aligned with the design system.

**Visual Overlays**: Skipped — no browser automation tool exposed in this session.

## Overall Impression

The design system document (DESIGN.md) is excellent — clear principles, strong north star, well-defined tokens. But the implementation barely reflects it. The product reads as "generic Bootstrap admin" rather than "trusted tool for congregation elders." The single biggest opportunity: strip all decorative color and bring the implementation into alignment with the already-well-defined design system. The bones are solid (semantic HTML, good role-based access, mobile-first drawer); the skin needs a complete color/radius/spacing reset.

## What's Working

1. **Semantic HTML structure**: Excellent use of `<main>`, `<section>`, `<article>`, `<header>` throughout — screen reader flow will be coherent.
2. **Good role-based hiding**: Create/edit buttons conditionally rendered based on OWNER/ADMIN roles — proper authority gating.
3. **Mobile-first sidebar drawer**: The mobile drawer has clear open/close states, organization label, search field, and full nav — thoughtful mobile IA.
4. **org-sidebar.tsx**: The only component fully aligned with DESIGN.md — correct radius, correct state inversion, correct hover patterns.

## Priority Issues

### P1: Decorative color violates the design system's core Neutral-Discipline Rule
- **What**: Every page uses chromatic color decoratively — gradient hero sections (`from-blue-600 to-violet-600`), colored icon backgrounds (`bg-blue-50 text-blue-600`, `bg-violet-50 text-violet-600`), hardcoded section colors in meetings (`#3c7f8b`, `#d68f00`, `#bf2f13`, `#b8860b`). Dashboard stat cards use 4 different icon color combinations with no semantic reason.
- **Why it matters**: "The Neutral-Discipline Rule" is the design system's most foundational rule: "Color appears only when it carries meaning. Adding color for decoration violates the system's contract." These violations make the product look like a generic Bootstrap dashboard, destroying the "A Estante Organizada" brand promise of quiet, trustworthy sobriety.
- **Fix**: Strip all decorative chromatic color. Use only the neutral palette (almost-black, pure-white, cloud, stone, smoke) for non-semantic UI. Reserve chromatic color for destructive actions (ember) only.
- **Suggested command**: `$impeccable colorize`

### P1: Inconsistent border-radius strategy across all pages
- **What**: Dashboard stat cards have no rounded corners (0px), people cards use `rounded-[28px]`, meetings uses `rounded-2xl` (16px), meeting part rows use `rounded-xl` (12px), mobile nav uses `rounded-lg` (10px). The design system specifies `rounded-4xl` (26px) for cards, `rounded-3xl` (22px) for inputs, `rounded-lg` (10px) for sidebar items. The org-header search input also uses `rounded-lg` instead of `rounded-3xl`.
- **Why it matters**: Corner radius is the defining visual characteristic of the design system ("generous rounded corners (26px max) create a soft, approachable silhouette"). Inconsistent radii make the product feel unpolished and un-systematic.
- **Fix**: Standardize all card surfaces to `rounded-4xl`, all inputs to `rounded-3xl`, keep sidebar at `rounded-lg`.
- **Suggested command**: `$impeccable shape`

### P1: Developer documentation visible to end users
- **What**: Groups page subtitle "Interface mobile first, conflitos explícitos e exclusão protegida." People page subtitle "Interface mobile first, semântica melhor e ações seguras." Footer cards display "Semântica", "Segurança", "Regras familiares" with development rationale text. Dashboard has "Próximos passos" listing dev TODOs.
- **Why it matters**: Violates Product Principle #5: "Every user is a publisher, not a developer — elders should be able to run their congregation without technical support." Elders seeing developer notes will lose confidence in the product's readiness.
- **Fix**: Remove all developer-facing copy. Replace with user-facing guidance or remove sections entirely.
- **Suggested command**: `$impeccable clarify`

### P2: Badge explosion and cognitive overload on people cards
- **What**: Each person card renders up to 7+ badges simultaneously (Active/Inactive, Young/Adult, Student, Baptized, Married, Family, Linked User, plus 5+ privilege chips). This creates visual noise that obscures the person's name — the primary identifier. Combined with 9 sidebar items, cognitive load scores HIGH (5/8 checklist failures).
- **Why it matters**: Elders scanning a list of 42 people must visually parse a wall of badges to find information. Working memory exceeds 4-item threshold at every decision point. Confused First-Timer persona (Jordan) will feel overwhelmed.
- **Fix**: Prioritize top 3-4 badges; collapse privileges behind an expandable section or show only a count ("5 privilégios"). Reduce sidebar to 5 primary items with overflow menu.
- **Suggested command**: `$impeccable distill`

### P2: Design token mismatch and font-size violations
- **What**: Detector found 13 font-size violations (10px/11px — below the 12px Label minimum) across meetings components. CSS token mismatch: `--primary` is `oklch(0.205 0 0)` but DESIGN.md says `oklch(0.145 0 0)`. Dashboard cards use `p-5` (20px) instead of specified 24px or 16px. These are 10+ hardcoded Tailwind values that won't respond to theme changes.
- **Why it matters**: When the design system evolves (e.g., dark mode), tokenless values will not respond. The codebase has two competing color strategies — raw utilities and semantic tokens.
- **Fix**: Normalize `--primary` to match DESIGN.md. Replace hardcoded font sizes with type tokens (`text-label`). Fix card padding to use design system spacing.
- **Suggested command**: `$impeccable polish`

### P2: Gradient hero sections use shadow-xl (reserved for modals)
- **What**: People and groups pages use `shadow-xl shadow-blue-600/20` on hero banners. The design system specifies `shadow-xl` is reserved exclusively for modal dialogs and popovers.
- **Why it matters**: Elevation hierarchy is broken. Users will perceive content banners as higher-priority than actual modals, confusing the spatial model of the interface.
- **Fix**: Remove shadow from hero sections or use `shadow-md` for card-level elevation.
- **Suggested command**: `$impeccable polish`

## Persona Red Flags

### Alex (Power User)
- **No keyboard shortcuts**: Cannot navigate between meetings/people/groups without mousing to sidebar. No `g p` → people, `g m` → meetings commands.
- **No bulk operations**: To edit privileges for 5 people, Alex must open 5 separate modals. No batch-edit or multi-select.
- **One-item-at-a-time assignment flow**: Assigning meeting parts requires clicking each role individually. For a weekly meeting with 12 parts, that is 12-36 individual modal interactions.
- **Forced modal pattern**: Every action (edit person, edit group, assign part) opens a modal. Alex cannot open in a new tab or work in parallel.

### Jordan (First-Timer)
- **No onboarding or contextual help**: Jordan opens the app and sees a dashboard with no explanation. No tooltip, no guided tour, no "learn more" link.
- **Developer copy erodes trust**: "Interface mobile first" sounds like the app is unfinished. "Criar a listagem inicial de tarefas" suggests the product is not ready.
- **9 sidebar items with partially labeled icons**: Items like "Discursos" and "Conteúdo de Reunião" are domain-specific — Jordan will not know what they mean without trying them.
- **No confirmation of success**: After creating a person or making an assignment, there is no toast, banner, or visible confirmation.

### Sam (Accessibility)
- **Focus indicators missing**: Sidebar items have `transition-colors` but no visible `focus-visible:ring` — keyboard navigation will be invisible.
- **Color-only meaning**: Badge component uses tone colors (emerald = active, neutral = inactive, blue/violet = types) — color alone conveys meaning without text alternatives.
- **11px fonts fail WCAG**: `text-[11px]` and `text-[10px]` in meeting components cannot guarantee WCAG AA compliance for readability.
- **Custom dialog components**: `PersonFormDialog`, `AssignmentDialog` are custom implementations — risk of breaking screen reader focus management.

## Minor Observations

- **Dashboard page**: 4 stat cards use different icon container styles — arbitrary color assignment with no semantic reason.
- **People page gender prominence**: Sex ("Masculino"/"Feminino") displayed under the person's name, but service privileges and family status are more operationally relevant for elders.
- **Meetings page section colors**: Hardcoded hex colors `#bf2f13` (red) and `#b8860b` (gold) on white may fail WCAG AA for smaller text.
- **Mobile drawer width**: `w-[88%]` is unusual — standard is 75-85% or fixed 320px.
- **Locale switcher in header**: Positioned between user info and logout — useful but unusual placement.
- **org-sidebar.tsx**: Fully correct — proper radius, states, and tokens. The model component.
- **Breadcrumbs with 9 items in labelMap**: Currently shows all possible routes regardless of depth.

## Questions to Consider

1. **What if the hero gradients were removed entirely?** The blue-violet banners take up 25-30% of initial viewport but contain only summary stats. Could a single text headline + compact stat row accomplish the same information density in 60% less vertical space — aligning with "interface recedes so data can lead"?

2. **What if the 9-item sidebar was collapsed into 4-5 primary items with a "More" menu?** Elders primarily use People, Groups, and Meetings. Could Cleaning, Outlines, Families, and Settings live under an overflow menu, reducing cognitive load?

3. **What would it take to make empty/placeholder states feel complete?** The dashboard shows "Aqui entrarão os dados reais" — a promise, not a state. Could empty states show illustrative examples or a setup checklist that transforms into a real dashboard?

4. **Is the Neutral-Discipline Rule too strict?** The design team intentionally chose a near-monochrome palette for trust and sobriety. But the implementation team added color because it felt more polished. Does the rule need loosening, or does the implementation need enforcing?
