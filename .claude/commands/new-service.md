Scaffold a Supabase service file and its companion React hook.

## Usage
Provide: entity name singular in camelCase (e.g. `examen`), plural (e.g. `examenes`), Supabase table name (e.g. `examenes`), and list of columns.

## Steps

### 1. Create `src/services/$PLURALService.js`
```js
import { supabase, getUid } from '../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const USE_MOCK = false;

// ── Normalize (snake_case DB → camelCase JS) ──────────────────
function normalize$ENTITY(r) {
  if (!r) return null;
  return {
    ...r,
    // Map snake_case or JSONB fields:
    // someField: r.some_field ?? r.someField ?? defaultValue,
  };
}

// ── Read ──────────────────────────────────────────────────────
export async function get$PLURAL() {
  if (USE_MOCK) return [];
  const { data, error } = await supabase
    .from('$TABLE').select('*').order('created_at');
  if (error) throw error;
  return (data ?? []).map(normalize$ENTITY);
}

export async function get$ENTITY(id) {
  if (USE_MOCK) return null;
  const { data, error } = await supabase
    .from('$TABLE').select('*').eq('id', id).single();
  if (error) throw error;
  return normalize$ENTITY(data);
}

// ── Write ─────────────────────────────────────────────────────
export async function create$ENTITY(item) {
  if (USE_MOCK) return { ...item, id: uuidv4() };
  const uid = await getUid();
  const { data, error } = await supabase.from('$TABLE').insert({
    user_id: uid,
    // Map camelCase input → snake_case DB columns:
    // name: item.name,
    // some_field: item.someField ?? defaultValue,
  }).select().single();
  if (error) throw error;
  return normalize$ENTITY(data);
}

export async function update$ENTITY(id, changes) {
  if (USE_MOCK) return { id, ...changes };
  const payload = {};
  // if (changes.name      !== undefined) payload.name       = changes.name;
  // if (changes.someField !== undefined) payload.some_field = changes.someField;
  const { data, error } = await supabase
    .from('$TABLE').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return normalize$ENTITY(data);
}

export async function delete$ENTITY(id) {
  if (USE_MOCK) return;
  const { error } = await supabase.from('$TABLE').delete().eq('id', id);
  if (error) throw error;
}
```

### 2. Create `src/hooks/use$PLURAL.js`
```js
import { useState, useEffect, useCallback } from 'react';
import {
  get$PLURAL, create$ENTITY, update$ENTITY, delete$ENTITY,
} from '../services/$PLURALService.js';

export function use$PLURAL() {
  const [$PLURAL, set$PLURAL] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      set$PLURAL(await get$PLURAL());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const add    = async (item)        => { await create$ENTITY(item);        await reload(); };
  const update = async (id, changes) => { await update$ENTITY(id, changes); await reload(); };
  const remove = async (id)          => { await delete$ENTITY(id);          await reload(); };

  return { $PLURAL, loading, error, reload, add, update, remove };
}
```

### 3. If a new table is needed
Add to `supabase/schema.sql`:
```sql
create table $TABLE (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  created_at timestamptz default now(),
  -- add columns here
);
alter table $TABLE enable row level security;
create policy "Users see own $TABLE" on $TABLE
  for all using (auth.uid() = user_id);
```

## Rules
- `USE_MOCK = false` — always keep false; stub block is for dev fallback only
- Write payloads use snake_case DB column names; `normalize` converts to camelCase on read
- `await getUid()` on every write — it throws if user is not authenticated
- JSONB mutations: read full array → modify in JS → write the entire array back (no partial update)
- Import service in the hook by relative path: `'../services/$PLURALService.js'`
