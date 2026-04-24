/**
 * analyzer.js — Analiza datos scrapeados con Claude
 *
 * Input: Reddit posts (pain points reales) + resultados de búsqueda web
 * Output: análisis de patrones + oportunidades para Universidad V1
 */

import Anthropic from '@anthropic-ai/sdk';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { APP, CLAUDE_MODEL } from './config.js';
import { OUTPUT_DIR, getWeekLabel, readJSON } from './utils.js';

export async function analyzeScrapedData(scrapedData = null) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Falta ANTHROPIC_API_KEY en .env');
  }

  if (!scrapedData) {
    const dataFile = join(OUTPUT_DIR, 'data', `scraped-${getWeekLabel()}.json`);
    scrapedData = readJSON(dataFile);
    if (!scrapedData) {
      throw new Error(`No hay datos scrapeados para ${getWeekLabel()}. Ejecuta: node run.js scrape`);
    }
  }

  const { reddit = [], search = [], totals } = scrapedData;

  // Si no hay datos, usar análisis base
  if (reddit.length === 0 && search.length === 0) {
    console.log('Sin datos scrapeados — usando análisis base...');
    return getBaselineAnalysis();
  }

  // Preparar resumen para el prompt
  const topReddit = reddit.slice(0, 30).map(p => ({
    titulo: p.title,
    texto: p.selftext,
    upvotes: p.score,
    comentarios: p.comments,
    subreddit: p.subreddit,
    url: p.url,
  }));

  const topSearch = search.slice(0, 10).map(r => ({
    query: r.query,
    titulo: r.title,
    descripcion: r.snippet,
    url: r.url,
  }));

  console.log(`\nAnalizando ${reddit.length} posts de Reddit + ${search.length} resultados web con Claude...`);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `
Eres un estratega de contenido para Instagram especializado en apps para universitarios chilenos.

Tienes dos fuentes de datos esta semana:

1. POSTS REALES DE REDDIT (r/chile, r/Universitarios, r/ingenieria) — lo que los estudiantes chilenos dicen sobre la universidad:
${JSON.stringify(topReddit, null, 2)}

2. RESULTADOS DE BÚSQUEDA WEB — tendencias de contenido universitario en redes sociales:
${JSON.stringify(topSearch, null, 2)}

CONTEXTO DE NUESTRO PRODUCTO:
- App: ${APP.nombre} (${APP.handle}) — ${APP.descripcion}
- Resuelve: ${APP.painPoints.join(' | ')}
- Features: ${APP.features.join(' | ')}
- Audiencia: ${APP.audiencia}
- Tono: directo, informativo, lenguaje informal chileno ("cachai", "po", "altiro")
- Formato: Reels 15-45 seg, el creador aparece con su cara

Analiza toda esta data y entrega:

## 1. PAIN POINTS MÁS FRECUENTES ESTA SEMANA
¿Qué problemas universitarios aparecen más en Reddit? Lista los top 5 con ejemplos textuales de los posts.
Sé específico: cita fragmentos reales.

## 2. LENGUAJE Y EXPRESIONES REALES
¿Cómo hablan los estudiantes chilenos en Reddit? Lista frases, expresiones, jerga real que usan.
Estos son exactamente los términos que debemos usar en los videos.

## 3. CONTEXTO EMOCIONAL
¿Qué emociones predominan? ¿Frustración? ¿Agobio? ¿Orgullo? ¿Humor negro?
¿Qué situaciones generan más comentarios/upvotes?

## 4. PATRONES DE CONTENIDO QUE FUNCIONA (web search)
¿Qué formatos de video están apareciendo en los resultados de búsqueda? ¿Qué tipos de contenido rankea?

## 5. OPORTUNIDADES DIRECTAS PARA ${APP.nombre.toUpperCase()}
Top 3 oportunidades concretas basadas en los pain points reales encontrados.
Formato: "Pain point: X (mencionado en [post]) → Video idea: Y → Hook sugerido: Z"

## 6. FRASES GANCHO BASADAS EN LA DATA
5 hooks de video inspirados en el lenguaje real que usan estos estudiantes.
Que suenen exactamente como ellos hablan, no como marketing.

## 7. QUÉ EVITAR
¿Qué enfoques o temas generan rechazo en esta comunidad?
`.trim();

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const analysis = response.content[0].text;

  const briefsDir = join(OUTPUT_DIR, 'briefs');
  if (!existsSync(briefsDir)) mkdirSync(briefsDir, { recursive: true });

  const filename = join(briefsDir, `analysis-${getWeekLabel()}.md`);
  const header = `# Análisis de Tendencias — ${getWeekLabel()}\n\nGenerado: ${new Date().toLocaleString('es-CL')}\nFuentes: ${totals?.redditPosts ?? reddit.length} posts Reddit + ${totals?.searchResults ?? search.length} resultados web\n\n---\n\n`;
  writeFileSync(filename, header + analysis);

  console.log(`✓ Análisis guardado en output/briefs/analysis-${getWeekLabel()}.md`);
  console.log('\n' + analysis.slice(0, 600) + '...\n');

  return { analysis, filename };
}

function getBaselineAnalysis() {
  const analysis = `
## 1. PAIN POINTS MÁS FRECUENTES (línea base)
1. "No entiendo el ramo y me pierdo" — confusión con materia acumulada
2. "Me pilló de sorpresa la prueba" — falta de planificación
3. "No sé si voy pasando o reprobando" — incertidumbre sobre notas
4. "Tengo todo en WhatsApp y me pierdo" — dispersión de información
5. "Olvidé entregar la tarea" — gestión de fechas límite

## 2. LENGUAJE REAL DE ESTUDIANTES CHILENOS
"me tiene con el agua al cuello", "me tiene chato el ramo",
"no tengo idea de cuándo es la prueba", "la safo a penas",
"el profe es una patá", "tengo 4 ramos al mismo tiempo",
"me perdí en clases y ahora no cacho nada"

## 3. CONTEXTO EMOCIONAL
Frustración alta + humor negro como mecanismo. Los posts con más engagement
combinan queja real con autoflagelación humorística. No buscan soluciones complejas,
buscan sentirse entendidos primero.

## 4. PATRONES DE CONTENIDO QUE FUNCIONA
- Problema relatable (3 seg) → mini-solución (20 seg) → CTA simple (5 seg)
- Cara a cámara + texto en pantalla = máxima retención
- Screen recording del app mostrando la solución en tiempo real

## 5. OPORTUNIDADES DIRECTAS
1. Pain point: "no sé cuándo son mis pruebas" → Video: "Así nunca más te pillan de sorpresa" → Hook: "¿Cuántas veces te ha pasado que te enteras de la prueba el día antes?"
2. Pain point: "no sé si voy pasando" → Video: "Calcula tu nota de presentación en 30 segundos" → Hook: "¿Vas pasando el ramo o te estás mintiendo?"
3. Pain point: "tengo todo disperso" → Video: "Un lugar para todos tus ramos" → Hook: "Antes tenía 4 grupos de WhatsApp, 3 mails y un cuaderno"

## 6. FRASES GANCHO
- "¿Cuántas veces te ha pillado de sorpresa una prueba?"
- "Esto es lo que debería existir desde primer año"
- "Llevaba así mis ramos y por eso reprobaba"
- "Le enseñé esto a un amigo y me lo agradeció al final del semestre"
- "Una sola app para no perderte en la U"

## 7. QUÉ EVITAR
- Tono corporativo o de "empresa" — estos estudiantes lo detectan altiro
- Prometer que "la U se vuelve fácil" — genera desconfianza
- Compararse con otras apps conocidas (genera debate, no conversión)
`.trim();

  return { analysis, filename: null };
}
