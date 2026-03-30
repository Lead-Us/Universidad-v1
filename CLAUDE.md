# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Production build (output: dist/)
npm run lint       # ESLint
npm run preview    # Preview production build locally
```

No test suite exists yet. There is no test runner configured.

## Architecture

**Stack:** React 19 + Vite + CSS Modules. No TypeScript. No state management library — all state is React hooks + context.

### Data layer

All data currently runs in **mock mode** (`USE_MOCK = true` in every service). The pattern is identical across services:

1. `src/services/localStore.js` — the persistence layer. Uses an in-memory `Map` cache so multiple services sharing the same localStorage key get the same array reference. Bumping `VERSION` clears all localStorage keys and re-seeds from `mockData.js`.
2. Each service (`ramosService`, `tasksService`, `scheduleService`, `aprendizajeService`) loads from `localStore.load()` into a module-level `DB_*` array, mutates it directly, then calls `localStore.save()`. The mock path and Supabase path are in the same `if (USE_MOCK)` branches.
3. To switch a service to Supabase: set `USE_MOCK = false` — the Supabase branches are already written but untested.

**localStorage keys:** `uni_ramos`, `uni_tasks`, `uni_schedule`, `uni_units`, `uni_aprendizaje_models`, `uni_aprendizaje_submodules`, `uni_files_{ramoId}` (files stored as base64 data URLs, max 3 MB each).

### Hook pattern

Every hook (`useRamos`, `useTasks`, `useSchedule`, `useRamo`, `useEvaluations`, `useAttendance`) follows the same structure: fetch on mount via `useCallback`-wrapped `reload()`, expose CRUD methods that call the service then call `reload()`. Components never call services directly — always through hooks.

`useRamo(id)` is special: `getRamo(id)` automatically joins `DB_SCHEDULE` blocks onto the ramo object. RamoForm reads `initial.blocks` from this.

### Contexts

- `src/lib/SettingsContext.jsx` — manages appearance (background, glass opacity, accent color, font color, blur, speed). On every change it writes CSS custom properties directly to `document.documentElement` via `applySettings()`. Presets have a `dark: true` flag that switches all `--lg-*` surface/shadow/border vars to dark-optimized values. Persisted to `universidad-v1-settings` in localStorage.
- `src/lib/AuthContext.jsx` — currently a mock with a hardcoded user. Supabase auth stubs exist but are empty. Multi-tenant Supabase auth is the next migration target.

### Design system

All visual tokens are CSS custom properties defined in `src/index.css`. The Liquid Glass system uses `--lg-*` variables. `SettingsContext.applySettings()` overrides these at runtime. Do not hardcode colors/shadows in component CSS — always use the variables.

Key variables: `--lg-surface`, `--lg-blur-base`, `--lg-shadow`, `--lg-border`, `--lg-radius-*`, `--accent`, `--accent-rgb`, `--text-primary/secondary/muted`.

The `body::before` pseudo-element renders the gradient blob background via `var(--lg-bg-gradient)`, which `SettingsContext` updates when the background preset changes.

### Inline editing

`src/components/shared/InlineEdit.jsx` — click-to-edit pattern used throughout. Props: `value`, `onSave`, `tag` (default `span`), `type`, `min/max/step`, `placeholder`. Saves on blur or Enter, cancels on Escape.

### Grade calculation

`src/lib/grades.js` — Chilean 1.0–7.0 scale. `moduleAverage(items)` averages graded items. `weightedFinalGrade(modules)` does weighted partial average (only modules that have at least one grade contribute). Used by `useEvaluations` hook and `EvaluationSchedule` component.

### Key data relationships

- Ramo → has many Units (with nested `materias[]` array) → stored in `uni_units`
- Ramo → has many schedule blocks → stored in `uni_schedule` (separate from ramo object, joined in `getRamo`)
- Ramo → has `evaluationModules[]` → embedded in ramo object in `uni_ramos`
- Ramo → has `attendanceSessions[]` → embedded in ramo object in `uni_ramos`
- Task → references `ramo_id`, `unit_id`, `materia` (string)
- Learning model → has submodules keyed by `model_id` in `uni_aprendizaje_submodules` (object shape: `{ modelId: [...] }`)

### Supabase / deployment

- `src/lib/supabase.js` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from env. Defaults to placeholder strings when missing.
- Environment variables go in `.env.local` (not committed).
- `vercel.json` does not exist yet — needs to be created with SPA rewrite rules for React Router.
