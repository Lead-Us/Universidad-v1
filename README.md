# Universidad v2

Chilean university student platform — AI tutoring, course management, scheduling, payments.

## What's in this repo

- `api/` — Vercel Serverless Functions (backend)
- `App Universidad v1 final.html` — frontend prototype (single-file React app, no build step)
- `Aprender modelos/` — prompt files for regular AI tutor
- `Cerebro Aprender/` — prompt files for exam tutor mode
- `supabase/` — schema + migrations (v3 → v9)

## Running locally

**Backend (API functions):**
```bash
npm install
vercel dev
```
API runs at `http://localhost:3000/api/...`

**Frontend prototype:**
Open `App Universidad v1 final.html` directly in a browser. It connects to the Vercel dev server for AI features, and to Supabase for data.

To enable Supabase in the prototype, replace the placeholder values near the top of the HTML:
```js
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

## Environment variables

Create a `.env` file at the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
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
2. `supabase/migrations_v3.sql`
3. `supabase/migrations_v4.sql`
4. `supabase/migrations_v5.sql`
5. `supabase/migrations_v6.sql`
6. `supabase/migrations_v7.sql`
7. `supabase/migrations_v8.sql`
8. `supabase/migrations_v9.sql`

## AI architecture

All AI features use a **Gemini → Claude** pipeline:
- **Gemini Flash** processes and analyzes uploaded documents (PDFs, files)
- **Claude Sonnet 4.6** generates all chat responses and text content via SSE streaming

## Key features

| Feature | API | Description |
|---------|-----|-------------|
| AI Tutor | `/api/aprender-chat` | Conductor + 5 teaching methods; auto-detects exam context and switches to exam tutor mode |
| Ejercicios | `/api/ejercicios-chat` | Generates new exercises matching the exact style of uploaded material |
| Trabajos | `/api/trabajos-generate` | Generates complete academic documents (PDF/DOCX/PPTX) |
| Payments | `/api/flow-*` | Flow.cl subscription (Chilean payment processor) |
| Instagram | `/api/instagram-*` | Automated social media publishing pipeline |
