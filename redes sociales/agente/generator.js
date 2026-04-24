/**
 * generator.js — Genera ideas y scripts de video con Claude
 *
 * Output:
 *   - 5 ideas rankeadas por potencial viral
 *   - Script completo para cada una de las top 3
 */

import Anthropic from '@anthropic-ai/sdk';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { APP, CLAUDE_MODEL } from './config.js';
import { OUTPUT_DIR, getWeekLabel, getDateLabel, readJSON } from './utils.js';

export async function generateIdeasAndScripts(analysis = null) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Falta ANTHROPIC_API_KEY en .env');
  }

  // Si no se pasa análisis, leer el de esta semana
  if (!analysis) {
    const analysisFile = join(OUTPUT_DIR, 'briefs', `analysis-${getWeekLabel()}.md`);
    if (existsSync(analysisFile)) {
      analysis = readFileSync(analysisFile, 'utf-8');
    } else {
      console.log('No hay análisis esta semana — generando con conocimiento base...');
      analysis = 'Sin análisis de scraping disponible esta semana.';
    }
  }

  console.log('\nGenerando 5 ideas + 3 scripts con Claude...');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // ── PASO 1: Generar 5 ideas ──────────────────────────────────────────────────
  const ideasPrompt = `
Eres el estratega creativo de contenido de ${APP.nombre}, app chilena para universitarios.

ANÁLISIS DE TENDENCIAS DE ESTA SEMANA:
${analysis}

CONTEXTO DEL PRODUCTO:
Nombre: ${APP.nombre} | Handle: ${APP.handle}
Qué hace: ${APP.descripcion}
Resuelve: ${APP.painPoints.join(' | ')}
Features: ${APP.features.join(' | ')}
Tono: ${APP.tono}
Audiencia: ${APP.audiencia}

FORMATO DE PRODUCCIÓN:
- El que aparece en cámara es mi primo (estudiante real, cara a cámara)
- También hay pantalla del app + voz en off
- Formato: Reels de 15-45 segundos
- Idioma: español chileno informal ("cachai", "po", "altiro", sin exagerar)
- Plataforma: Instagram Reels

GENERA EXACTAMENTE 5 IDEAS DE VIDEO, rankeadas del 1 (mayor potencial viral) al 5.

Para cada idea incluye:

### IDEA #[N] — [TÍTULO DEL VIDEO]
**Potencial viral:** Alto / Medio-alto / Medio (con justificación en 1 línea)
**Hook (primeros 3 segundos):** Texto exacto que dice o muestra
**Formato:** Cara a cámara / Pantalla app / Mixto (cara + pantalla)
**Duración estimada:** X segundos
**Concepto:** 2-3 líneas describiendo qué pasa en el video
**Por qué va a funcionar:** 1 línea concreta ligada a los patrones del análisis

---

Sé creativo y específico. Cada idea debe ser distinta en formato y enfoque.
`.trim();

  const ideasResponse = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1500,
    messages: [{ role: 'user', content: ideasPrompt }],
  });

  const ideas = ideasResponse.content[0].text;
  console.log('✓ 5 ideas generadas');

  // ── PASO 2: Scripts para las top 3 ideas ────────────────────────────────────
  const scriptsPrompt = `
Eres el guionista de ${APP.nombre}. Basándote en estas 5 ideas de video:

${ideas}

Escribe el SCRIPT COMPLETO para las ideas #1, #2 y #3.

Para cada script usa este formato exacto:

═══════════════════════════════════════════════
SCRIPT: [TÍTULO DEL VIDEO]
Idea #[N] | Duración estimada: [X] segundos
═══════════════════════════════════════════════

[ANTES DE GRABAR]
Qué necesitas preparar/tener abierto en el app

[ENCUADRE INICIAL]
Cómo posicionarse frente a la cámara, qué se ve

---

[SECCIÓN 1 — HOOK] (0-5 seg)
HABLA: "[texto exacto a decir]"
TEXTO EN PANTALLA: [texto overlay si aplica]
ACCIÓN: [qué hace con el cuerpo/app]

[SECCIÓN 2 — DESARROLLO] (5-30 seg)
HABLA: "[texto exacto a decir]"
TEXTO EN PANTALLA: [texto overlay si aplica]
ACCIÓN: [qué hace — navega el app, gesticula, etc.]

[SECCIÓN 3 — CTA] (últimos 5 seg)
HABLA: "[texto exacto a decir]"
TEXTO EN PANTALLA: "Descarga gratis — @universidadv1"

---

[POST-PRODUCCIÓN]
MÚSICA: [tipo de música / mood / ejemplo de canción]
TRANSICIONES: [corte limpio / zoom / none]
STICKERS/GFX: [cualquier elemento extra en edición]

[CAPTION]
Texto completo del caption (máx 3 líneas) + hashtags
Hashtags: [5-8 hashtags específicos]

═══════════════════════════════════════════════

IMPORTANTE:
- El diálogo debe sonar 100% chileno natural, NO como texto corporativo
- El primo habla como habla — directo, sin leer un paper
- Las instrucciones de acción deben ser ultra claras para que él pueda grabarlo solo
`.trim();

  const scriptsResponse = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 3000,
    messages: [{ role: 'user', content: scriptsPrompt }],
  });

  const scripts = scriptsResponse.content[0].text;
  console.log('✓ 3 scripts completos generados');

  // ── Guardar outputs ──────────────────────────────────────────────────────────
  const briefsDir = join(OUTPUT_DIR, 'briefs');
  const scriptsDir = join(OUTPUT_DIR, 'scripts');
  if (!existsSync(briefsDir)) mkdirSync(briefsDir, { recursive: true });
  if (!existsSync(scriptsDir)) mkdirSync(scriptsDir, { recursive: true });

  const week = getWeekLabel();
  const date = getDateLabel();

  // Brief semanal completo
  const briefContent = `# Brief Semanal — ${week}
Generado: ${new Date().toLocaleString('es-CL')}

---

## IDEAS DE LA SEMANA (5)

${ideas}

---

## SCRIPTS COMPLETOS (Top 3)

${scripts}
`;

  const briefFile = join(briefsDir, `brief-${week}.md`);
  writeFileSync(briefFile, briefContent);

  // Scripts por separado (para el editor de video)
  const scriptsFile = join(scriptsDir, `scripts-${week}.md`);
  writeFileSync(scriptsFile, `# Scripts ${week}\n\n${scripts}`);

  console.log(`\n✓ Brief completo: output/briefs/brief-${week}.md`);
  console.log(`✓ Scripts: output/scripts/scripts-${week}.md`);

  // Preview en consola
  console.log('\n─────────────────────────────────────');
  console.log('IDEAS GENERADAS:');
  console.log('─────────────────────────────────────');
  // Mostrar solo los títulos de las ideas
  const titleMatches = ideas.match(/### IDEA #\d+ — .+/g) ?? [];
  titleMatches.forEach(t => console.log(' ' + t));

  return { ideas, scripts, briefFile, scriptsFile };
}
