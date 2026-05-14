# Universidad v1

Chilean university student platform — AI tutoring, course management, scheduling, payments.

**Production:** [universidadv1.vercel.app](https://universidadv1.vercel.app) (auto-detects mobile/desktop)

## What's in this repo

- `index.html` — Device router (mobile → `/mobile.html`, desktop → `/app.html`)
- `app.html` — Desktop frontend (single-file React 18 app)
- `mobile.html` — Mobile frontend (single-file React 18 app, source at `/universidad-movil/`)
- `api/` — 20 Vercel Serverless Functions (backend)
- `Aprender modelos/` — Prompt files for regular AI tutor
- `Cerebro Aprender/` — Prompt files for exam tutor mode
- `supabase/` — Schema + migrations (v3 → v9)

## Architecture

Both frontends share the same Supabase backend and API endpoints. Changes on mobile reflect on desktop and vice versa.

```
universidadv1.vercel.app
├── /              → index.html (auto-routes by device)
├── /app.html      → Desktop app
├── /mobile.html   → Mobile app
└── /api/*         → 20 serverless functions (shared)
```

**AI pipeline:** Gemini Flash (document analysis) → Claude Sonnet 4.6 (response generation) → SSE streaming

## Running locally

**Backend (API functions):**
```bash
npm install
vercel dev
```
API runs at `http://localhost:3000/api/...`

**Desktop:** Open `app.html` directly in a browser.

**Mobile:** Open the source at `../universidad-movil/index.html` in a browser (or `mobile.html` in this repo).

## Deploying

```bash
# Update mobile from source
cp ../universidad-movil/index.html mobile.html
sed -i '' "s|const API_BASE = '.*';|const API_BASE = '';|" mobile.html

# Deploy
git add -A && git commit -m "Update"
vercel --prod --yes
```

**Git email must match Vercel account** (`contacto@leadus.cl`) or deploy will be blocked.

## Environment variables

Create `.env.local` at project root:

```
VITE_SUPABASE_URL=https://kxstenolowfaubyoxovx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
ANTHROPIC_API_KEY_APRENDER=...
GEMINI_API_KEY=...
FLOW_API_KEY=...
FLOW_SECRET_KEY=...
ADMIN_EMAIL=...
CRON_SECRET=...
INSTAGRAM_ACCESS_TOKEN=...
INSTAGRAM_USER_ID=...
INSTAGRAM_APP_ID=...
INSTAGRAM_APP_SECRET=...
```

## Database setup

Run in Supabase SQL Editor in this order:
1. `supabase/schema.sql`
2. `supabase/migrations_v3.sql` → `migrations_v9.sql`

**Core tables:** `profiles`, `ramos`, `units`, `schedule`, `tasks`
**AI tables:** `learning_models`, `aprender_blocks`, `aprender_block_chats`, `aprender_block_sources`, `aprender_block_memory`
**Tools:** `ejercicios_blocks`, `ejercicios_chats`, `trabajos`, `apuntes`
**Files:** `ramo_files`, `ramo_file_folders`
**Other:** `instagram_queue`, `feedback`

## Key features

| Feature | API | Description |
|---------|-----|-------------|
| AI Tutor | `/api/aprender-chat` | 5 teaching methods + auto-detects exam context |
| Ejercicios | `/api/ejercicios-chat` | Generates exercises matching uploaded material style |
| Trabajos | `/api/trabajos-generate` | Generates academic documents (PDF/DOCX/PPTX) |
| Payments | `/api/flow-*` | Flow.cl subscription (Chilean payment processor) |
| Instagram | `/api/instagram-*` | Automated social media publishing pipeline |
| Analytics | `/api/analytics` | Admin dashboard with KPIs |
