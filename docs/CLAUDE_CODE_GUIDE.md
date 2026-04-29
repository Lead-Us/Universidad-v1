# Claude Code — Guía de Uso para universidadv1

Referencia completa de todas las capacidades de Claude Code configuradas en este proyecto: qué hacen, cuándo usarlas y mejores prácticas.

---

## Índice

1. [Skills (Comandos Custom)](#1-skills-comandos-custom)
2. [Hooks (Automatizaciones)](#2-hooks-automatizaciones)
3. [.claudeignore (Control de Contexto)](#3-claudeignore-control-de-contexto)
4. [MCP: Puppeteer (Testing Visual)](#4-mcp-puppeteer-testing-visual)
5. [MCP: IDE getDiagnostics (Diagnóstico en Tiempo Real)](#5-mcp-ide-getDiagnostics-diagnóstico-en-tiempo-real)
6. [Worktrees (Features Aisladas)](#6-worktrees-features-aisladas)
7. [Memory System (Contexto Persistente)](#7-memory-system-contexto-persistente)
8. [Permissions (Seguridad)](#8-permissions-seguridad)
9. [Agentes Paralelos](#9-agentes-paralelos)
10. [Keybindings (Atajos)](#10-keybindings-atajos)
11. [Mejores Prácticas](#11-mejores-prácticas)

---

## 1. Skills (Comandos Custom)

Las skills son prompts maestros que se activan con `/nombre-skill`. Están en `.claude/commands/`.

### Skills disponibles en este proyecto

| Skill | Activación | Qué hace |
|---|---|---|
| `new-page` | `/new-page` | Crea página `.jsx` + `.module.css` + registra ruta en App.jsx |
| `new-component` | `/new-component` | Crea componente React con el patrón del proyecto |
| `new-service` | `/new-service` | Crea service file + hook siguiendo el patrón del proyecto |
| `fix-supabase` | `/fix-supabase` | Diagnóstico paso a paso de problemas con Supabase |

### Cuándo usar skills vs prompt libre

- **Usa skills** para tareas repetitivas con estructura fija: crear archivos, scaffolding, diagnósticos.
- **Usa prompt libre** para tareas únicas: refactors, bug fixes, análisis.

### Cómo crear una nueva skill

1. Crea el archivo en `.claude/commands/mi-skill.md`
2. Escribe el prompt maestro con instrucciones detalladas
3. Actívala con `/mi-skill`

**Estructura recomendada para un skill:**
```markdown
# Mi Skill

Pregunta al usuario: [qué información necesitas]

Luego:
1. Lee los archivos relevantes
2. Aplica el patrón del proyecto
3. Valida con lint
```

---

## 2. Hooks (Automatizaciones)

Los hooks son comandos shell que se ejecutan automáticamente en respuesta a eventos de Claude Code. Configurados en `.claude/settings.json`.

### PostToolUse — Auto-lint tras cada edición

```json
{
  "matcher": "Edit|Write|MultiEdit",
  "hooks": [{
    "type": "command",
    "command": "cd /ruta/proyecto && npm run lint --silent 2>&1 | head -50"
  }]
}
```

**Qué hace:** Corre ESLint automáticamente cada vez que Claude edita o crea un archivo.
**Por qué:** Claude ve los errores de lint en tiempo real y los corrige sin que tengas que pedírselo.

### PreToolUse — Seguridad antes de git commit

**Script:** `.claude/hooks/check-env-staged.sh`

**Qué hace:** Antes de ejecutar cualquier `git commit`, escanea si hay archivos `.env` en el staging area. Si los detecta, **bloquea el commit** con exit code 2 y muestra un mensaje de advertencia.

**Por qué:** Evita que secretos (API keys, DB passwords) lleguen accidentalmente al repositorio.

**Cómo funciona técnicamente:**
- PreToolUse recibe el JSON del tool call en stdin
- El script parsea el campo `command` para detectar `git commit`
- Si hay `.env` staged → `exit 2` (bloquea) + mensaje de error
- En cualquier otro caso → `exit 0` (permite)

### Cómo agregar nuevos hooks

En `.claude/settings.json`, dentro de `"hooks"`:

```json
"PostToolUse": [
  {
    "matcher": "Bash",
    "hooks": [{
      "type": "command",
      "command": "tu-comando-aqui"
    }]
  }
]
```

**Eventos disponibles:**
- `PreToolUse` — Antes de ejecutar el tool. Exit 2 = bloquea.
- `PostToolUse` — Después de ejecutar el tool.
- `Stop` — Al final de cada respuesta de Claude.

**Matchers comunes:** `Edit`, `Write`, `Bash`, `Read`, `Glob`, `Edit|Write|MultiEdit`

---

## 3. .claudeignore (Control de Contexto)

El archivo `.claudeignore` funciona igual que `.gitignore` pero para el contexto que Claude puede leer.

### Por qué importa

Claude tiene una ventana de contexto limitada. Si lee `node_modules/` o assets binarios, desperdicia tokens que podrían usarse para entender el código real. Un buen `.claudeignore` hace que las búsquedas sean más rápidas y precisas.

### Qué está excluido en este proyecto

| Categoría | Archivos/dirs excluidos | Razón |
|---|---|---|
| Dependencias | `node_modules/`, `dist/` | No es código del proyecto |
| Secretos | `.env`, `.env.local` | Seguridad |
| Binarios | `*.png`, `*.pdf`, `*.woff`... | No son texto útil |
| Contenido estudiantil | `Ramos/`, `"Aprender modelos"/` | Archivos de usuarios, no código |
| Social media | `"redes sociales"/` | Contenido de marketing, no código |
| Caché | `.vite/`, `supabase/.temp/` | Artefactos generados |

### Regla general

Si no es código fuente ni configuración relevante del proyecto → excluirlo.

---

## 4. MCP: Puppeteer (Testing Visual)

Puppeteer está habilitado como MCP server. Permite a Claude controlar un browser real para verificar cambios visuales sin que tengas que abrir el browser tú mismo.

### Cómo activarlo en una sesión

En tu settings.local.json ya está configurado:
```json
{
  "enabledMcpjsonServers": ["puppeteer"]
}
```

### Herramientas disponibles

| Tool | Qué hace |
|---|---|
| `puppeteer_navigate` | Navega a una URL |
| `puppeteer_screenshot` | Toma screenshot y lo muestra en el chat |
| `puppeteer_click` | Hace click en un selector |
| `puppeteer_fill` | Llena un input |
| `puppeteer_evaluate` | Ejecuta JavaScript en el browser |
| `puppeteer_hover` | Hover sobre un elemento |

### Flujo de trabajo recomendado

1. Corre el dev server: `npm run dev`
2. Pide a Claude: "Aplica el cambio y luego toma un screenshot de http://localhost:5173/ramos para verificar que se ve bien"
3. Claude edita → navega → screenshot → te muestra el resultado

### Casos de uso concretos en este proyecto

- Verificar que una nueva página se renderiza correctamente
- Comprobar responsive design en viewports distintos
- Depurar un componente que visualmente no se ve como esperabas
- Validar flujos: login → crear ramo → ver dashboard

### Ejemplo de prompt

```
Aplica los cambios al componente RamoCard, luego:
1. Navega a localhost:5173
2. Toma un screenshot
3. Dime si el diseño se ve correcto
```

---

## 5. MCP: IDE getDiagnostics (Diagnóstico en Tiempo Real)

`mcp__ide__getDiagnostics` lee los errores actuales de TypeScript/ESLint directamente desde el editor sin correr comandos.

### Cuándo usarlo

- Cuando hay errores en el editor que Claude no detecta con lint
- Para diagnóstico rápido antes de empezar a editar
- Como primer paso en un bug fix: "revisar qué errores hay actualmente"

### Cómo pedírselo a Claude

```
Antes de editar, usa getDiagnostics para ver qué errores hay actualmente en el proyecto
```

### Diferencia con npm run lint

| | `npm run lint` | `getDiagnostics` |
|---|---|---|
| Velocidad | ~2-3 segundos | Inmediato |
| Tipo de errores | Solo ESLint | ESLint + TypeScript + IDE |
| Requiere servidor | No | Sí (VS Code/IDE abierto) |

---

## 6. Worktrees (Features Aisladas)

Los worktrees de git permiten trabajar en una feature en una carpeta temporal completamente separada de `main`, sin riesgo de contaminar tu rama principal.

### Cuándo usarlos

- Refactors grandes (ej. migrar auth, cambiar estructura de DB)
- Features experimentales que pueden romperse
- Probar algo sin commitment

### Cómo activarlos con Claude

Di: "Usa un worktree para implementar [feature arriesgada]"

Claude usará la tool `EnterWorktree` para:
1. Crear un worktree temporal en una rama nueva
2. Hacer todos los cambios ahí
3. Al terminar, puedes hacer merge o descartar sin afectar `main`

### Limpieza automática

Si Claude no hace cambios en el worktree, se limpia solo. Si hay cambios, devuelve el path y la rama para que decidas si hacer merge.

---

## 7. Memory System (Contexto Persistente)

El sistema de memoria guarda información entre conversaciones para que Claude no olvide contexto importante entre sesiones.

### Tipos de memoria

| Tipo | Qué guarda | Ejemplo |
|---|---|---|
| `user` | Tu perfil, preferencias, nivel técnico | "Ernesto prefiere explicaciones cortas" |
| `feedback` | Correcciones a comportamiento de Claude | "No agregar comentarios innecesarios" |
| `project` | Estado actual del proyecto, decisiones | "Refactor de auth planificado para mayo" |
| `reference` | Dónde está la info externa | "Issues en Linear proyecto UNIV" |

### Ubicación

`~/.claude/projects/-Users-ernestoah-Documents-Antigravity-universidadv1/memory/`

### Cuándo Claude guarda automáticamente

- Cuando aprendes algo nuevo sobre el proyecto
- Cuando corriges el comportamiento de Claude
- Cuando hay decisiones arquitecturales importantes

### Cuándo pedirle que guarde explícitamente

```
Recuerda que el módulo de asistencia siempre debe validar has_attendance=true antes de mostrar datos
```

### Cuándo NO usar memoria

- Tareas temporales de la sesión actual → usa TaskCreate
- Código y patrones → ya están en CLAUDE.md
- Historial git → usa `git log`

---

## 8. Permissions (Seguridad)

Las permissions en `.claude/settings.json` controlan qué comandos puede ejecutar Claude sin pedirte permiso.

### Allow list actual

```
npm run lint/build/dev/preview
git status, diff, log
git add src/*, .claude/*, supabase/*, api/*, docs/*
git commit*
git stash*, worktree*
mcp__puppeteer__*
mcp__ide__getDiagnostics
```

### Deny list actual

```
rm -rf*              ← destrucción de archivos
git push --force*    ← sobrescribir historial remoto
git reset --hard*    ← perder cambios sin confirmación
```

### Cómo funciona

- **Allow**: Claude ejecuta sin preguntarte
- **Deny**: Bloqueado siempre, aunque tú lo pidas explícitamente
- **Sin regla**: Claude te pregunta antes de ejecutar

### Agregar permisos

Edita `.claude/settings.json` → sección `permissions.allow`. Usa patrones glob: `Bash(comando*)`.

---

## 9. Agentes Paralelos

Claude puede lanzar múltiples sub-agentes simultáneamente para explorar diferentes partes del codebase al mismo tiempo. Esto reduce significativamente el tiempo en tareas de investigación.

### Tipos de agentes disponibles

| Tipo | Cuándo usar |
|---|---|
| `Explore` | Explorar el codebase, buscar archivos y patrones |
| `Plan` | Diseñar implementaciones complejas |
| `general-purpose` | Tareas multi-step autónomas |

### Cuándo Claude usa agentes automáticamente

En modo plan (antes de implementar algo complejo), Claude lanza agentes paralelos para:
- Explorar archivos relacionados
- Buscar patrones existentes a reutilizar
- Entender el contexto antes de proponer cambios

### Cómo aprovecharlos

Antes de features grandes, activa el modo plan:
```
/plan Quiero agregar [feature] al módulo de [área]
```

---

## 10. Keybindings (Atajos)

Puedes configurar atajos de teclado para tus skills más usadas en `~/.claude/keybindings.json`.

### Configurar atajos

Usa el skill integrado:
```
/keybindings-help
```

Esto te guiará para:
- Crear atajos chord (Ctrl+K → Ctrl+P)
- Modificar el submit key
- Asignar skills a combinaciones de teclas

### Atajos sugeridos para este proyecto

| Atajo | Skill |
|---|---|
| `Ctrl+Shift+N` | `/new-component` |
| `Ctrl+Shift+P` | `/new-page` |
| `Ctrl+Shift+S` | `/new-service` |
| `Ctrl+Shift+F` | `/fix-supabase` |

---

## 11. Mejores Prácticas

### Para desarrollo diario

**Empieza sesiones con contexto claro**
```
Estoy trabajando en [módulo]. El problema es [descripción concreta].
Archivos relevantes: [paths]
```

**Usa `/plan` antes de features grandes**
Activa el modo plan para que Claude explore el código, diseñe el enfoque y te pida confirmación antes de tocar nada.

**Deja que el hook de lint trabaje**
No interrumpas el proceso después de editar. El hook corre lint automáticamente y Claude verá y corregirá los errores.

**Un commit por feature, no por archivo**
Pide a Claude que agrupe los cambios relacionados en un solo commit descriptivo.

### Para mantenimiento

**Después de cada sesión de cambios → deploy**
```
Haz el build, verifica que pasa, y luego dame el resumen para hacer deploy a Vercel
```

**Actualiza CLAUDE.md cuando cambie la arquitectura**
Si agregas una tabla nueva a Supabase, un nuevo patrón, o cambias convenciones → pide a Claude que actualice `CLAUDE.md`.

**Usa `getDiagnostics` al inicio de sesiones de debugging**
Antes de buscar un bug, pide el diagnóstico actual del IDE para no perseguir errores que ya están detectados.

### Seguridad

- Nunca hagas `git add .env*` — el hook lo bloqueará, pero es mejor el hábito
- El deny list bloquea `rm -rf` y `git push --force` permanentemente
- Las API keys van en Vercel env vars, nunca en el código

### Para features de IA

**El endpoint `/api/aprender-chat.js` es el más crítico**
Cualquier cambio aquí → prueba el streaming manualmente antes de hacer deploy.

**Prueba Puppeteer con flujos de chat**
```
Abre localhost:5173/aprender, navega a un cuaderno,
y toma screenshots del flujo completo de chat
```

### Cuando algo falla

1. Usa `getDiagnostics` para ver errores actuales
2. Pide a Claude que lea el error completo antes de proponer fixes
3. Para problemas de Supabase → `/fix-supabase`
4. Si el estado es inconsistente → usa worktree para experimentar sin riesgo

---

## Referencia Rápida

| Quiero... | Uso |
|---|---|
| Crear nueva página | `/new-page` |
| Crear nuevo componente | `/new-component` |
| Crear service + hook | `/new-service` |
| Debuggear Supabase | `/fix-supabase` |
| Ver cambio visual | Puppeteer screenshot |
| Ver errores del editor | `getDiagnostics` |
| Feature arriesgada sin tocar main | Worktree |
| Diseñar antes de implementar | Modo Plan |
| Recordar algo entre sesiones | Memory system |
| Atajos personalizados | `/keybindings-help` |
