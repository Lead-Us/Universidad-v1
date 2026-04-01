Diagnose and fix Supabase issues step by step.

## Step 1 — Verify environment variables
Check that both vars exist in `.env.local`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Read `src/lib/supabase.js` — if either var is missing/placeholder, the client silently fails.
For Vercel production: check dashboard → Settings → Environment Variables.

## Step 2 — Check Row Level Security (RLS)
Every table requires `user_id = auth.uid()`. The most common failure: inserting a row without `user_id` in the payload.

```sql
-- Check existing policies in Supabase SQL editor:
select tablename, policyname, cmd, qual
from pg_policies
where schemaname = 'public';
```

Fix: ensure `const uid = await getUid()` is called and `user_id: uid` is in the `.insert()` payload.

## Step 3 — Verify schema matches service code
Compare column names in `supabase/schema.sql` against the `.insert()`/`.update()` payload in the service file.
Common mismatch: JS sends camelCase (`evaluationModules`) but DB column is `evaluation_modules`.

## Step 4 — Fix missing JSONB defaults
If JSONB columns return `null` instead of `[]`:
```sql
alter table ramos alter column evaluation_modules  set default '[]'::jsonb;
alter table ramos alter column attendance_sessions set default '[]'::jsonb;
alter table units alter column materias            set default '[]'::jsonb;
```

## Step 5 — Read the actual error
In browser DevTools → Network, find the failing Supabase request and read the response body.

Common PostgreSQL error codes:
| Code | Meaning | Fix |
|---|---|---|
| `42501` | RLS denied | Add `user_id` to insert payload |
| `23503` | Foreign key violation | Referenced `ramo_id` doesn't exist |
| `23514` | Check constraint failed | `tasks.type` not in allowed set |
| `PGRST116` | `.single()` got 0 or 2+ rows | Use `.maybeSingle()` or fix the query |

## Step 6 — Auth / session issues
If `getUid()` throws "No autenticado":
1. Open DevTools console: `await supabase.auth.getSession()` — check if session is valid
2. Confirm the user is logged in via `AuthContext`
3. Supabase auto-refreshes tokens but the tab must be active — reload and retry

## Step 7 — Supabase edge function (Claude AI)
1. Open Supabase dashboard → Edge Functions → Logs
2. Confirm `ANTHROPIC_API_KEY` is set: Supabase → Settings → Edge Functions → Secrets
3. Test locally: `supabase functions serve process-folder --env-file .env.local`

## Step 8 — Groq API (`/api/process-folder.js`)
1. Confirm `GROQ_API_KEY` is set in Vercel → Settings → Environment Variables
2. Check Vercel → Functions → Logs for the `process-folder` function
3. The handler tries 4 models in sequence (llama-3.3-70b → llama3-70b → llama3-8b → mixtral)
4. If all fail, the response contains an `errors` array with each attempt's failure reason
