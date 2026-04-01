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
| `learning_models` | — | Custom study strategies |
| `learning_submodules` | — | Belongs to learning_model |
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
/* Shadows */       var(--lg-shadow)   var(--lg-shadow-hover)
/* Blur */          var(--blur-sm)     var(--blur-base)  var(--blur-lg)
/* Text */          var(--text-primary) var(--text-secondary) var(--text-muted)
/* Accent */        var(--accent)      var(--accent-rgb)  var(--accent-bg)
/* Typography */    var(--text-xs/sm/base/lg/xl/2xl/3xl)
/* Timing */        var(--dur-fast) = 280ms   var(--dur-base) = 380ms
```
Themes: `claro · calido · colorido · oscuro · noche` — applied by `SettingsContext` at runtime.
Icons: `react-icons/ri` only (Remix Icons). Example: `import { RiAddLine } from 'react-icons/ri'`.

## AI Integration
- `/api/process-folder.js` — Vercel serverless, POST, uses `GROQ_API_KEY`
  - Receives `{ structure, textContents }`, returns `{ ramos: [...] }`
  - Tries 4 Groq models in fallback chain (llama-3.3-70b → llama3-70b → llama3-8b → mixtral)
- `supabase/functions/process-folder/` — Deno edge function, uses `ANTHROPIC_API_KEY`, same interface

## Env Vars
| Var | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Vite client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Vite client | Supabase anon key |
| `GROQ_API_KEY` | Vercel server-only | Groq API for folder import |
| `ANTHROPIC_API_KEY` | Supabase edge fn | Claude API for edge fn |

## Gotchas
1. `getUid()` throws if not authenticated — wrap write operations in try/catch
2. **JSONB mutations**: read full array → modify in JS → write entire array back (no partial patch)
3. `schedule.day_of_week`: 0=Monday through 6=Sunday — NOT JavaScript's 0=Sunday
4. `tasks.due_date` is a `date` string (`YYYY-MM-DD`) — append `T12:00:00` when constructing `Date` to avoid timezone shifts
5. `/api/*` files are Vercel serverless (CommonJS) — not processed by Vite, no ESM imports
