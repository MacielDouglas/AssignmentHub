# Plano: Refatoração da Página de Reuniões

## Objetivo
Adicionar um modal de criação/edição de reuniões que mostra a programação da apostila (MWB) com navegação entre semanas e opções de designação manual.

## Requisitos
1. Botão "Criar Reunião" no card de reunião do meio de semana
2. Modal com programação da apostila, mostrando uma semana por vez
3. Navegação entre semanas (avançar/voltar) com carregamento sob demanda
4. Opções de designação de pessoas para as partes (sem auto-save)
5. Botão "Salvar" para gravar designações manualmente
6. Botões "Editar" e "Apagar" quando a reunião já existe
7. "Apagar" remove apenas as designações, não o programa

## Arquitetura

### Fluxo Atual
```
MeetingsPage (Server)
  └─ loadMeetingWeekQuery(slug, week)
       └─ MeetingsPageContent (Client)
            ├─ WeekNavigation (prev/next week)
            └─ MeetingProgramCard (variant=midweek|weekend)
                 └─ MidweekSections / WeekendSections
                      └─ MeetingPartRow → AssignmentDialog
```

### Fluxo Novo
```
MeetingsPage (Server)
  └─ loadMeetingWeekQuery(slug, week)
       └─ MeetingsPageContent (Client)
            ├─ WeekNavigation (prev/next week)
            └─ MeetingWeekSection (novo)
                 ├─ Se NÃO existe reunião: Botão "Criar Reunião"
                 ├─ Se EXISTE reunião:
                 │    ├─ Botões "Editar" / "Apagar"
                 │    └─ MeetingProgramCard (somente visualização)
                 └─ MeetingWeekModal (novo)
                      ├─ Header: semana atual + nav avançar/voltar
                      ├─ Lista de partes da semana (MWB)
                      ├─ Para cada parte: opção de designar pessoa
                      └─ Footer: botão "Salvar"
```

## Componentes a Criar

### 1. `MeetingWeekSection` (novo)
- **Caminho:** `src/features/meetings/presentation/components/meeting-week-section.tsx`
- **Responsabilidade:** Decidir se mostra botão "Criar Reunião" ou o card existente
- **Props:** `data: MeetingWeekDto`, `view: "midweek" | "weekend"`
- **Estado:** `modalOpen: boolean`, `modalMode: "create" | "edit"`

### 2. `MeetingWeekModal` (novo)
- **Caminho:** `src/features/meetings/presentation/components/meeting-week-modal.tsx`
- **Responsabilidade:** Modal principal com navegação entre semanas
- **Props:** `open`, `onOpenChange`, `slug`, `initialWeekStart`, `mode`, `existingProgram?`
- **Estado:**
  - `currentWeekStart: string` (data da semana atual no modal)
  - `weekData: MeetingWeekDto | null` (dados carregados)
  - `loading: boolean`
  - `assignments: Map<string, AssignmentDraft>` (designações pendentes)
  - `saving: boolean`
- **Funcionalidades:**
  - Carrega dados da semana via server action ao abrir e ao navegar
  - Mantém designações pendentes em estado local (sem salvar)
  - Botão "Salvar" envia todas as designações pendentes
  - Botão "Apagar" limpa todas as designações da reunião

### 3. `MwbWeekHeader` (novo)
- **Caminho:** `src/features/meetings/presentation/components/mwb-week-header.tsx`
- **Responsabilidade:** Header do modal com navegação entre semanas
- **Props:** `weekStart`, `weekEnd`, `locale`, `onPrev`, `onNext`, `loading`
- **Conteúdo:**
  - Label da semana (ex: "1-7 de setembro")
  - Botões ← e → para navegar
  - Indicador de loading

### 4. `MwbWeekParts` (novo)
- **Caminho:** `src/features/meetings/presentation/components/mwb-week-parts.tsx`
- **Responsabilidade:** Lista de partes da semana com opções de designação
- **Props:** `parts: MeetingPartDto[]`, `scheduledTime`, `assignments`, `onAssign`, `onClear`
- **Agrupamento:** Reutiliza `buildMidweekVisualSections` existente
- **Para cada parte:**
  - Título + tema + duração
  - Seção (Tesouros, Ministério, Vida Cristã)
  - Campo de designação (nome da pessoa ou "Não designado")
  - Botão para abrir AssignmentDialog

### 5. `MwbPartRow` (novo)
- **Caminho:** `src/features/meetings/presentation/components/mwb-part-row.tsx`
- **Responsabilidade:** Linha de uma parte no modal
- **Props:** `part: MeetingPartDto`, `assignment`, `onAssign`, `onClear`
- **Diferença do MeetingPartRow existente:**
  - Mais compacto (para caber no modal)
  - Designação editável inline (não abre dialog separado)
  - Botão X para limpar designação

## Server Actions a Criar

### 1. `loadMwbWeeksListAction`
- **Caminho:** `src/features/meetings/application/actions/load-mwb-weeks-list.action.ts`
- **Input:** `{ slug: string, centerWeekStart?: string }`
- **Output:** `Array<{ weekStart: string, weekEnd: string, label: string }>`
- **Lógica:** Busca semanas da apostila disponíveis para a organização

### 2. `loadMeetingWeekForModalAction`
- **Caminho:** `src/features/meetings/application/actions/load-meeting-week-for-modal.action.ts`
- **Input:** `{ slug: string, weekStart: string }`
- **Output:** `MeetingWeekDto` (reutiliza a query existente)
- **Lógica:** Chama `loadMeetingWeekQuery` existente

### 3. `saveMeetingAssignmentsBatchAction`
- **Caminho:** `src/features/meetings/application/actions/save-meeting-assignments-batch.action.ts`
- **Input:** `{ slug: string, programId: string, assignments: Array<{ partId: string, role: string, personId?: string, subPersonId?: string, externalName?: string }> }`
- **Output:** `ActionResult`
- **Lógica:** Salva todas as designações de uma vez (dentro de transaction)

### 4. `clearMeetingAssignmentsAction`
- **Caminho:** `src/features/meetings/application/actions/clear-meeting-assignments.action.ts`
- **Input:** `{ slug: string, programId: string }`
- **Output:** `ActionResult`
- **Lógica:** Remove todas as designações do programa (deleteMany)

## Componentes a Modificar

### 1. `MeetingsPageContent`
- **Mudança:** Substituir `MeetingProgramCard` direto por `MeetingWeekSection`
- **Antes:**
  ```tsx
  <MeetingProgramCard program={data.midweek} ... />
  ```
- **Depois:**
  ```tsx
  <MeetingWeekSection data={data} view={view} />
  ```

### 2. `src/features/meetings/index.ts`
- **Mudança:** Exportar novas server actions

## Ordem de Implementação

1. **Server Actions** (base)
   - `loadMeetingWeekForModalAction`
   - `saveMeetingAssignmentsBatchAction`
   - `clearMeetingAssignmentsAction`

2. **Componentes de UI** (modal)
   - `MwbWeekHeader`
   - `MwbPartRow`
   - `MwbWeekParts`
   - `MeetingWeekModal`

3. **Integração** (página)
   - `MeetingWeekSection`
   - Atualizar `MeetingsPageContent`
   - Exportar actions no index

## Decisões de Design

### Performance
- **Lazy load:** Dados de cada semana carregados sob demanda via server action
- **Estado local:** Designações pendentes mantidas em `Map` no estado do modal
- **Debounce:** Não necessário (usuário clica explicitamente em "Salvar")
- **Skeleton:** Loading states com skeleton para UX suave

### UX
- **Modal responsivo:** `max-h-[min(800px,calc(100dvh-2rem))]` para caber em telas pequenas
- **Navegação por teclado:** Setas esquerda/direita para navegar entre semanas
- **Confirmação:** "Apagar" pede confirmação antes de limpar designações
- **Feedback:** Toast de sucesso/erro ao salvar

### Estilo
- Seguir padrão existente do `AssignmentDialog` (shadcn Dialog + Radix)
- Usar `cn()` do `@/lib/utils` para classes condicionais
- Seguir padrão de Server Actions com `ActionResult<T>`

## Riscos

1. **Performance do modal:** Muitas partes podem tornar o modal lento
   - Mitigação: Virtualizar lista se necessário (por enquanto, ~15 partes é aceitável)

2. **Concorrência:** Dois usuários editando a mesma semana
   - Mitigação: Último save vence (já é o comportamento atual)

3. **Dados inconsistentes:** Modal com dados desatualizados
   - Mitigação: Reload ao abrir modal, warning antes de navegar se há mudanças pendentes
