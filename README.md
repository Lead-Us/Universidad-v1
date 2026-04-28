# Universidad V1

> **Estado:** Beta privada — [universidadv1.vercel.app](https://universidadv1.vercel.app)

Sistema de gestión académica para estudiantes universitarios chilenos, con asistencia pedagógica impulsada por IA. Optimiza el estudio, centraliza los archivos y mejora las notas con menos tiempo.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + React Router 6 + Vite |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| Serverless | Vercel Functions (CommonJS) |
| IA / Chat | Anthropic Claude Sonnet 4.6 |
| IA / Archivos | Groq (llama-3.3-70b → fallback chain) |
| Pagos | Stripe |
| PDF / ZIP | pdfjs-dist + fflate |
| Estilos | CSS Modules + CSS Custom Properties |

## Funcionalidades

- **Ramos** — gestión de cursos con unidades, módulos de evaluación y notas (escala chilena 1.0–7.0)
- **Asistencia** — registro de sesiones por ramo con porcentaje de asistencia
- **Calendario & Tareas** — vista mensual con tareas y evaluaciones por ramo
- **Aprender** — cuadernos de estudio con asistente IA pedagógico (métodos Herrera y Matemático)
- **Notebook** — editor de notas con tutor IA
- **Importar Archivos** — carga masiva de PDFs/ZIPs que extrae metadatos de cada ramo automáticamente
- **Suscripción** — plan único de $7.990 CLP/mes vía Stripe con webhooks

## Estructura del Proyecto

```
src/
  lib/          # supabase.js · AuthContext · SettingsContext · grades.js · ramoColors.js
  services/     # Queries a Supabase — un archivo por dominio
  hooks/        # Controladores React — un archivo por dominio
  pages/        # Componentes de ruta — un .jsx + un .module.css cada uno
  components/   # Agrupados por dominio: shared/ ramos/ dashboard/ calendario/ aprender/ layout/
  styles/        # Animaciones globales
  chat/         # Gestión de sesión de chat
  prompts/      # Loader de prompts pedagógicos

api/            # Vercel serverless functions (CommonJS, no procesadas por Vite)
supabase/       # schema.sql + migraciones + Deno edge functions
Aprender modelos/  # Prompts pedagógicos en Markdown
```

## Rutas de la App

| Ruta | Página | Acceso |
|---|---|---|
| `/` | Dashboard | Autenticado + suscrito |
| `/ramos` | Lista de ramos | Autenticado + suscrito |
| `/ramos/:id` | Detalle de ramo | Autenticado + suscrito |
| `/calendario` | Calendario y tareas | Autenticado + suscrito |
| `/aprender` | Módulos de aprendizaje | Autenticado + suscrito |
| `/aprender/:notebookId` | Cuaderno | Autenticado + suscrito |
| `/aprender/:notebookId/:blockId` | Bloque de aprendizaje | Autenticado + suscrito |
| `/notebook` | Notebook del estudiante | Autenticado + suscrito |
| `/settings` | Configuración | Autenticado + suscrito |
| `/importar` | Importar archivos | Autenticado + suscrito |
| `/admin` | Panel admin | Autenticado + suscrito |
| `/tutorial` | Tutorial de la app | Público |
| `/login` | Inicio de sesión | Público |
| `/register` | Registro | Público |
| `/checkout` | Pago Stripe | Autenticado |
| `/tareas` | Alias de `/calendario` | Autenticado + suscrito |

## API Endpoints

| Endpoint | Propósito | AI |
|---|---|---|
| `POST /api/aprender-chat` | Asistente pedagógico por bloques | Claude Sonnet 4.6 |
| `POST /api/notebook-chat` | Tutor de notebook | Claude Sonnet 4.6 |
| `POST /api/extract-syllabus` | Extracción de syllabus desde PDF | Claude |
| `POST /api/process-folder` | Procesamiento masivo de archivos | Groq |
| `POST /api/create-account` | Creación de cuenta de usuario | — |
| `POST /api/grant-free` | Acceso free tier | — |
| `POST /api/flow-create-subscription` | Crear suscripción Stripe | — |
| `POST /api/flow-confirm` | Confirmar pago | — |
| `POST /api/flow-webhook` | Webhook de Stripe | — |

## Base de Datos (Supabase)

| Tabla | Columnas JSONB | Notas |
|---|---|---|
| `profiles` | — | Espejo de `auth.users`, tiene `name` |
| `ramos` | `evaluation_modules`, `attendance_sessions` | Entidad principal |
| `units` | `materias` | Pertenece a un ramo |
| `schedule` | — | `day_of_week`: 0=Lun … 6=Dom (NO convención JS) |
| `tasks` | — | `type` ∈ {tarea, evaluación, control, quiz} |
| `learning_models` | — | Cuadernos de aprendizaje |
| `learning_submodules` | — | Legacy; pertenece a `learning_model` |
| `aprender_blocks` | — | Bloques de un cuaderno (`project_id` → `learning_models`) |
| `aprender_block_sources` | — | Fuentes por bloque (archivo, URL, texto) |
| `aprender_block_chats` | — | Historial de chat por bloque |
| `aprender_block_memory` | — | Memoria pedagógica IA por bloque (UNIQUE user_id+block_id) |
| `aprender_project_memory` | — | Memoria pedagógica IA por cuaderno (UNIQUE user_id+project_id) |
| `feedback` | — | Feedback de usuarios |

Todas las tablas: RLS habilitado, política `auth.uid() = user_id` en cada fila.

## Variables de Entorno

Copia `.env.example` a `.env.local` y completa:

```env
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Anthropic — chat pedagógico (aprender-chat, notebook-chat)
ANTHROPIC_API_KEY_APRENDER=

# Anthropic — fallback (extract-syllabus, etc.)
ANTHROPIC_API_KEY=

# Groq — importación de archivos (process-folder)
GROQ_API_KEY=
```

## Comandos

```bash
npm install          # Instalar dependencias
npm run dev          # Dev server en puerto 5173
npm run build        # Build de producción → dist/
npm run lint         # ESLint
npm run preview      # Preview del build
npm run test:chat    # Test del sistema de chat
```

## Convenciones de Código

**snake_case → camelCase:** Supabase retorna snake_case; los servicios normalizan a camelCase antes de retornar. Al escribir en Supabase, usar siempre snake_case en `.insert()` / `.update()`.

**Mutaciones JSONB:** leer array completo → modificar en JS → escribir array completo de vuelta (sin patch parcial).

**`getUid()`** lanza si no hay sesión activa — envolver operaciones de escritura en try/catch.

**`tasks.due_date`** es string `YYYY-MM-DD` — agregar `T12:00:00` al construir `Date` para evitar desfases de zona horaria.

**`schedule.day_of_week`:** 0=Lunes … 6=Domingo (distinto a la convención JS de 0=Domingo).

## Tema

**Tema oscuro único** — `SettingsContext` aplica un tema dark minimal fijo en runtime via CSS custom properties en `document.documentElement`. No hay selector de temas. Nunca hardcodear colores; usar siempre `var(--...)`.

## Deployment

- **Frontend:** Vercel (Vite SPA, rewrite de todas las rutas a `index.html`)
- **Serverless:** Vercel Functions (`/api/*`)
- **Base de datos:** Supabase (PostgreSQL managed)
- **Edge Functions:** Supabase Deno runtime (`supabase/functions/`)
