# Universidad V1 — Claude Code Guide

Chilean university student management app. React 19 + Vite + Supabase + Groq/Claude AI. Deployed on Vercel.

## Commands
```bash
npm run dev        # Vite dev server (port 5173)
npm run build      # Production build → dist/
npm run lint       # ESLint flat config (eslint.config.js)
npm run preview    # Preview built dist
```

## Architecture
```
src/
  lib/          # supabase.js, AuthContext.jsx, SettingsContext.jsx, grades.js
  services/     # All Supabase queries — one file per domain
  hooks/        # Custom hooks as controllers — one file per domain
  pages/        # Route-level components — one .jsx + one .module.css each
  components/   # Grouped by domain: shared/ ramos/ dashboard/ calendario/ aprender/ layout/
  styles/       # Global CSS utilities and animations
api/            # Vercel serverless functions (CommonJS, NOT Vite-bundled)
supabase/       # schema.sql + Deno edge functions
```

## Supabase Tables
| Table | JSONB columns | Notes |
|---|---|---|
| `ramos` | `evaluation_modules`, `attendance_sessions` | Core entity |
| `units` | `materias` | Belongs to ramo |
| `schedule` | — | `day_of_week` 0=Mon…6=Sun (not JS convention) |
| `tasks` | — | `type` ∈ {tarea, evaluación, control, quiz} |
| `learning_models` | — | Cuadernos (notebooks) |
| `learning_submodules` | — | Legacy; belongs to learning_model |
| `aprender_blocks` | — | Bloques inside a cuaderno (`project_id` → learning_models) |
| `aprender_block_sources` | — | Fuentes per block (file, url, text) |
| `aprender_block_chats` | — | Chat history per block |
| `aprender_block_memory` | — | AI pedagogical memory per block (UNIQUE user_id+block_id) |
| `aprender_project_memory` | — | AI pedagogical memory per notebook (UNIQUE user_id+project_id) |
| `feedback` | — | User feedback submissions |
| `profiles` | — | Mirrors auth.users, has `name` |

All tables: RLS enabled, `auth.uid() = user_id` policy on every row.

## snake_case → camelCase Rule
Supabase returns snake_case. Services normalize to camelCase before returning.
```js
function normalizeRamo(r) {
  return {
    ...r,
    evaluationModules:  r.evaluation_modules  ?? r.evaluationModules  ?? [],
    attendanceSessions: r.attendance_sessions ?? r.attendanceSessions ?? [],
    hasAttendance:      r.has_attendance      ?? r.hasAttendance      ?? false,
  };
}
```
When writing to Supabase: always use snake_case in `.insert()` / `.update()` payloads.

## Service Pattern
```js
import { supabase, getUid } from '../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const USE_MOCK = false; // keep false; mock block is a dev stub only

export async function getFoos() {
  if (USE_MOCK) return [];
  const { data, error } = await supabase.from('foos').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(normalizeFoo);
}

export async function createFoo(item) {
  const uid = await getUid(); // throws if not authenticated
  const { data, error } = await supabase.from('foos')
    .insert({ user_id: uid, name: item.name, some_field: item.someField })
    .select().single();
  if (error) throw error;
  return normalizeFoo(data);
}
```

## Hook Pattern
```js
export function useFoos() {
  const [foos, setFoos]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try { setFoos(await getFoos()); setError(null); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const add    = async (item)        => { await createFoo(item);        await reload(); };
  const update = async (id, changes) => { await updateFoo(id, changes); await reload(); };
  const remove = async (id)          => { await deleteFoo(id);          await reload(); };

  return { foos, loading, error, reload, add, update, remove };
}
```

## Page Pattern
```jsx
export default function MiPagina() {
  return (
    <div className="page">
      <div className="page-content">
        <div className="section-header">
          <h1 className="section-title">Título</h1>
        </div>
        {/* content */}
      </div>
    </div>
  );
}
```
Routes are registered in `src/App.jsx` inside `<Route element={<Layout />}>`.

## CSS / Theming
ALL visual tokens are CSS custom properties — never hardcode colors, shadows, or blur.
```css
/* Surfaces */      var(--lg-surface)  var(--lg-surface-hover)  var(--lg-border)
/* Shadows */       var(--lg-shadow)   var(--lg-shadow-hover)   var(--lg-shadow-modal)
/* Blur */          var(--blur-sm)     var(--blur-base)  var(--blur-lg)  /* all → none currently */
/* Text */          var(--text-primary) var(--text-secondary) var(--text-muted)
/* Accent */        var(--accent)      var(--accent-rgb)  var(--accent-bg)
/* Typography */    var(--text-xs/sm/base/lg/xl/2xl/3xl)
/* Timing */        var(--dur-fast) = 180ms   var(--dur-base) = 240ms
/* Radius */        var(--lg-radius-xl) var(--lg-radius-lg) var(--lg-radius-md)
/* Spacing */       var(--space-1) … var(--space-16)  (8pt grid)
/* Fonts */         var(--font-display) = DM Sans   var(--font-claude) = Inter (AI chat only)
```
**Single dark theme** — `SettingsContext` applies one fixed dark minimal theme at runtime via inline CSS vars on `document.documentElement`. There is no multi-theme switcher.
Icons: `react-icons/ri` only (Remix Icons). Example: `import { RiAddLine } from 'react-icons/ri'`.

## AI Integration

### `/api/aprender-chat.js` — Primary AI chat (Anthropic)
- POST, streams SSE (`text/event-stream`)
- Body: `{ sources, messages, blockMemory, projectMemory, planMode? }`
- Events: `{ chunk }` during stream, then `{ done, blockMemory, projectMemory }` at end
- Uses `ANTHROPIC_API_KEY_APRENDER` (falls back to `ANTHROPIC_API_KEY`)
- Model: `claude-sonnet-4-6`
- Prompts built in `api/_prompts.js` → `buildConductorPrompt()` / `buildPlanPrompt()`
- After each exchange, generates updated `blockMemory` (≤200 words) and `projectMemory` (≤150 words)

### `/api/process-folder.js` — Folder import (Groq)
- POST, uses `GROQ_API_KEY`
- Receives `{ structure, textContents }`, returns `{ ramos: [...] }`
- Tries 4 Groq models in fallback chain (llama-3.3-70b → llama3-70b → llama3-8b → mixtral)

### `/api/notebook-chat.js` — Legacy notebook chat
### `/api/extract-syllabus.js` — Extract syllabus data from a single file
### `supabase/functions/process-folder/` — Deno edge function, uses `ANTHROPIC_API_KEY`, same interface as process-folder

## Env Vars
| Var | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Vite client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Vite client | Supabase anon key |
| `GROQ_API_KEY` | Vercel server-only | Groq API for folder import |
| `ANTHROPIC_API_KEY_APRENDER` | Vercel server-only | Claude for aprender-chat (primary) |
| `ANTHROPIC_API_KEY` | Supabase edge fn + fallback | Claude API for edge fn |

## Gotchas
1. `getUid()` throws if not authenticated — wrap write operations in try/catch
2. **JSONB mutations**: read full array → modify in JS → write entire array back (no partial patch)
3. `schedule.day_of_week`: 0=Monday through 6=Sunday — NOT JavaScript's 0=Sunday
4. `tasks.due_date` is a `date` string (`YYYY-MM-DD`) — append `T12:00:00` when constructing `Date` to avoid timezone shifts
5. `/api/*` files are Vercel serverless (CommonJS) — not processed by Vite, no ESM imports
6. **SSE streaming** in `/api/aprender-chat.js`: set `res.setHeader('Content-Type', 'text/event-stream')` and flush with `res.write()`. Client reads with `ReadableStream` / `EventSource`. Never buffer the full response.
7. **AI Memory upsert**: `aprender_block_memory` and `aprender_project_memory` use `UNIQUE(user_id, block_id/project_id)` — always use `.upsert(..., { onConflict: '...' })`, never `.insert()`.
8. **`/tareas` route** → renders `<Calendario />` — it's an alias, not a separate page.
