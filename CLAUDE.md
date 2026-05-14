# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

**Universidad v1 — full-stack platform for Chilean university students.** Backend is a set of Vercel Serverless Functions in `api/`. The frontend prototype lives in `App Universidad v1 final.html` — a single-file React 18 app (UMD + Babel standalone, no build step) used as the design reference and working prototype.

Features: AI tutoring, exam prep tutor, AI exercise generator, AI document generator, course management, scheduling, notes editor, file library, payments.

## Frontend prototype (`App Universidad v1 final.html`)

Single HTML file. Stack: React 18.3.1 (UMD), Babel standalone, Supabase JS v2 (UMD), html2pdf.js. No build tooling.

**8 navigation sections:**

| Section | Component | Description |
|---|---|---|
| `inicio` | `SecInicio` | Dashboard: weekly schedule, upcoming evaluations, recent notebooks |
| `ramos` | `SecRamos` | Course manager: grades, attendance %, files (Biblioteca), syllabus by unit |
| `aprender` | `SecAprender` | AI tutor: 3-panel layout (cuadernos → bloques → chat with LaTeX rendering) |
| `calendario` | `SecCalendario` | Monthly calendar + task list (evaluaciones + entregas pendientes) |
| `ejercicios` | `SecEjercicios` | AI exercise generator — upload material, get new exercises in same style |
| `apuntes` | `SecApuntes` | Block-based note editor (headings, bullets, LaTeX math blocks) |
| `trabajos` | `SecTrabajos` | AI document generator → editable PDF/DOCX/PPTX with live preview |
| `biblioteca` | `SecBiblioteca` | 3-column file library: ramo → sección/unidad → archivos |

Additional: `SecYo` (user profile/settings), `TweaksPanel` (dark/light theme toggle).

## Deployment target

All `api/` files are **Vercel Serverless Functions** — each exports a default `handler(req, res)`. Cron jobs go in `vercel.json`.

## AI architecture

**Pattern used across ALL AI features: Gemini processes documents → Claude generates responses.**

- **Gemini API** (`gemini-2.0-flash`) — processes and analyzes all uploaded documents/sources (PDFs, files). Extracts structured data, style analysis, or requirements before passing context to Claude.
- **Claude API** (`claude-sonnet-4-6`) — generates all chat responses, streaming text output, and document content.

### `aprender-chat.js` — AI tutor

Uses `_prompts.js` to compose system prompts from markdown files in `Aprender modelos/` and `Cerebro Aprender/`.

**Regular study mode:**
- `buildConductorPrompt()` = `00_BASE_PROMPT.md` + `06_CONDUCTOR.md` + methods `01`–`05`
- `buildPlanPrompt()` = `00_BASE_PROMPT.md` + `07_PLAN_GENERATOR.md` (first message — generates study roadmap)

**Exam mode (auto-detected):**
- `detectExamContext()` scores signals in uploaded sources (exam structure, points, duration) and last user message (urgency). Score ≥ 2 triggers exam mode.
- `buildExamConductorPrompt()` = `00_BASE_EXAMEN.md` + `06_CONDUCTOR_EXAMEN.md` + discipline methods `02`–`05` + `01_DETECTOR_EXAMEN.md`
- `buildExamPlanPrompt()` = `00_BASE_EXAMEN.md` + `07_PLAN_EXAMEN.md`

Streams SSE chunks. On completion updates `blockMemory` (per-block summary, Haiku) and `projectMemory` (per-notebook summary, Haiku).

### `ejercicios-chat.js` — Exercise generator

1. Fetch files from Supabase Storage URLs
2. Gemini Flash analyzes each file → extracts `tipo_preguntas`, `notacion`, `estructura_ejercicio`, `dificultad`, `ejemplos`
3. Claude Sonnet streams new exercises matching the exact style

### `trabajos-generate.js` — Document generator

1. Fetch files from Supabase Storage URLs
2. Gemini Flash analyzes instruction file → extracts `objetivo`, `secciones_requeridas`, `criterios`, `extension`, `contenido_clave`
3. Claude Sonnet streams markdown (pdf/docx) or JSON slides (pptx)

## Environment variables required

| Variable | Used by |
|---|---|
| `VITE_SUPABASE_URL` | All Supabase clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin/service operations (bypasses RLS) |
| `ANTHROPIC_API_KEY` | `notebook-chat.js`, `ejercicios-chat.js`, `trabajos-generate.js` |
| `ANTHROPIC_API_KEY_APRENDER` | `aprender-chat.js` (separate key for AI tutor) |
| `GEMINI_API_KEY` | `ejercicios-chat.js`, `trabajos-generate.js` (document analysis) |
| `FLOW_API_KEY` / `FLOW_SECRET_KEY` | Subscription payments via Flow.cl |
| `ADMIN_EMAIL` | `create-account.js`, `grant-free.js` (gate for admin actions) |
| `CRON_SECRET` | `instagram-cron.js`, `weekly-metrics.js` (Vercel Cron auth) |
| `INSTAGRAM_ACCESS_TOKEN` / `INSTAGRAM_USER_ID` / `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET` | Instagram Graph API |

## API endpoints

| File | Method | Route | Purpose |
|---|---|---|---|
| `aprender-chat.js` | POST | `/api/aprender-chat` | SSE AI tutor — regular study + exam auto-detection |
| `ejercicios-chat.js` | POST | `/api/ejercicios-chat` | Gemini style analysis → Claude SSE exercise generator |
| `trabajos-generate.js` | POST | `/api/trabajos-generate` | Gemini requirements extraction → Claude SSE document generator |
| `trabajos-download.js` | POST | `/api/trabajos-download` | Converts generated content to downloadable PDF/DOCX/PPTX |
| `notebook-chat.js` | POST | `/api/notebook-chat` | Simple AI tutor for notebook sources |
| `extract-syllabus.js` | POST | `/api/extract-syllabus` | Claude Haiku extracts ramo data from PDF/text |
| `analytics.js` | GET | `/api/analytics` | Admin dashboard — requires `app_metadata.role = 'admin'` |
| `create-account.js` | POST | `/api/create-account` | Admin creates a user account |
| `grant-free.js` | GET/POST | `/api/grant-free` | Admin grants/revokes free access |
| `flow-create-subscription.js` | POST | `/api/flow-create-subscription` | Creates Flow.cl hosted payment URL |
| `flow-webhook.js` | GET | `/api/flow-webhook` | Flow calls this on payment; updates `profiles.subscription_status` |
| `flow-confirm.js` | GET | `/api/flow-confirm` | Verifies token and updates profile after payment |
| `instagram-publish.js` | POST | `/api/instagram-publish` | Publishes image/carousel to Instagram via Graph API |
| `instagram-cron.js` | GET | `/api/instagram-cron` | Hourly cron — drains `instagram_queue` table |
| `instagram-queue.js` | GET/POST | `/api/instagram-queue` | CRUD for `instagram_queue` table |
| `instagram-token-check.js` | GET | `/api/instagram-token-check` | Validates Instagram token expiry |
| `weekly-metrics.js` | GET | `/api/weekly-metrics` | Weekly KPI cron (Monday 12:00 UTC) |
| `process-folder.js` | POST | `/api/process-folder` | Processes uploaded folder into study sources |

## Prompt files

`Aprender modelos/` — regular study mode:
- `00_BASE_PROMPT.md`, `06_CONDUCTOR.md`, `07_PLAN_GENERATOR.md`
- Teaching methods: `01_HERRERA_COMPLETO.md`, `02_MATEMATICO.md`, `03_TECNICO_MEMORIZACION.md`, `04_HISTORIA_HUMANIDADES.md`, `05_IDIOMAS.md`

`Cerebro Aprender/` — exam tutor mode:
- `00_BASE_EXAMEN.md`, `06_CONDUCTOR_EXAMEN.md`, `07_PLAN_EXAMEN.md`, `01_DETECTOR_EXAMEN.md`
- Discipline methods: `02_METODO_INGENIERIAS.md`, `03_METODO_DERECHO_SOCIAL.md`, `04_METODO_MEDICINA_SALUD.md`, `05_METODO_NEGOCIOS_ECONOMIA.md`

## Database schema

Apply in order: `schema.sql` → `migrations_v3.sql` → … → `migrations_v9.sql`

**Core tables:** `profiles`, `ramos`, `units`, `schedule`, `tasks`

**AI tutor tables:** `learning_models` → `learning_submodules` (cuadernos), `aprender_blocks` → `aprender_block_chats` + `aprender_block_sources`

**Ejercicios tables** (migrations_v9): `ejercicios_blocks`, `ejercicios_chats`

**Trabajos table** (migrations_v9): `trabajos` (stores generated content as `content_html` or `slides_json`)

**Support tables:** `ramo_files`, `ramo_file_folders`, `instagram_queue`, `user_surveys`, `user_analytics`, `feedback`

**RPC functions** (migrations_v8): `get_active_users_count`, `get_daily_signups`, `get_daily_activity`, `get_top_universities` — all `SECURITY DEFINER`, used by the analytics endpoint.

## Payments (Flow.cl)

Flow is the Chilean payment processor (not Stripe). Subscription flow:
1. `flow-create-subscription.js` → creates subscription with plan `"Universidad v1 - MES"` → returns hosted payment URL.
2. User pays → Flow calls `flow-webhook.js` (urlConfirmation) → updates `profiles.subscription_status = 'active'`.
3. `flow-confirm.js` (urlReturn) → user lands here after payment, verifies token again.

All Flow requests are signed with HMAC-SHA256 over sorted params.

## Module system note

`api/` uses ESM (`import`/`export default`) for all newer files. Legacy CJS: `analytics.js`, `weekly-metrics.js`. When adding new files, use ESM.
