# AssignmentHub

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are elders (anciãos) of Jehovah's Witnesses congregations who manage meeting programs, assignments, and cleaning rosters. Secondary users are congregation members who view their own assignments.

## Product Purpose

AssignmentHub centralizes people, groups, meetings, cleaning schedules, and assignments in one place — replacing spreadsheets and paper workflows with an integrated digital system purpose-built for Jehovah's Witnesses congregations.

## Positioning

Centralizes people, groups, meetings, cleaning schedules, and designations in a single integrated platform — no more juggling spreadsheets, paper rosters, and manual calendars.

## Operating Context

Congregation elders coordinate midweek and weekend meeting programs with rotating assignments, organize field service groups, and manage Kingdom Hall cleaning rosters. The workflow spans a full weekly cycle: import meeting content from JW Library (.jwpub files), review AI-extracted material, assign speakers/readers/chairmen/prayers, generate cleaning rosters with fairness rotation, and export PDFs. Multiple elders and ministerial servants share access with role-based permissions (OWNER/ADMIN/MEMBER).

## Capabilities and Constraints

- Midweek (Apostila/Guia de Atividades) and weekend (Discurso Público + Sentinela) meeting program generation
- Meeting content catalog: MWB issues, Watchtower studies, songbooks, public talk outlines — imported from .jwpub files with AI-assisted extraction via Groq (llama-3.3-70b-versatile)
- Candidate assignment dialog with eligibility filtering (sex, baptized status, service privileges, flags)
- Cleaning schedule generator with configurable sectors, modes (Person/Family/Group), and fairness rotation
- Group management with field service group membership
- Member management with full attribute tracking (privileges, flags, family links)
- PDF export for cleaning rosters (jsPDF)
- Internationalization: Portuguese (pt-BR) and Spanish (es)
- Authentication via Google OAuth (Better Auth)
- Role-based access: SUPER_ADMIN (platform-wide), OWNER/ADMIN/MEMBER (per organization)
- PostgreSQL via Neon serverless, Prisma ORM
- Maximum upload 100 MB, max expanded 80 MB for .jwpub files
- Server action body size limit: 200 MB

## Brand Commitments

- Product name: **AssignmentHub** — *"Plataforma inteligente para coordenação"*
- Contact: contato@assignmenthub.app
- Values communicated in UI: trust (designações corretas e consistentes), technology (IA e automação), organization (ambiente claro e centralizado)
- Congregation data is never shared with third parties; data in transit and at rest is encrypted

## Evidence on Hand

- Real congregation data model in Prisma schema (people, groups, assignments, schedules, cleaning lists)
- JW Library .jwpub extraction pipeline (ZIP → SQLite → structured content)
- Cleaning roster generator with fairness tracking and PDF export
- Meeting program generator with diff-based upsert
- AI-assisted content review flow with Groq API
- Full i18n in pt-BR and es

## Product Principles

1. **One source of truth** — All congregation data lives in a single, structured system rather than scattered across spreadsheets and paper.
2. **Automate the routine, review the critical** — Let AI handle content extraction and roster generation, but always require human review for imported teaching material and final assignment decisions.
3. **Fairness by design** — Assignment and cleaning rotation algorithms must distribute workload equitably and surface history so elders can avoid overburdening the same people.
4. **Privacy is non-negotiable** — Congregation data belongs to the congregation. Never share with third parties; encrypt in transit and at rest.
5. **Every user is a publisher, not a developer** — Elders should be able to run their congregation without technical support. The interface must be clear, forgiving, and self-explanatory.

## Accessibility & Inclusion

The product serves users who may not be technically proficient. Portuguese and Spanish interfaces, clear labels, forgiving form flows.
