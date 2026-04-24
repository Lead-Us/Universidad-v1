/**
 * tracker.js — Seguimiento de performance de @universidadv1
 *
 * Usa Instagram Graph API (ya tienes el token) para obtener métricas reales.
 * Fallback: ingreso manual si el token no está disponible.
 *
 * Variables necesarias en .env:
 *   INSTAGRAM_ACCESS_TOKEN  → ya está en .env.local del proyecto
 *   INSTAGRAM_USER_ID       → ya está en .env.local del proyecto
 */

import Anthropic from '@anthropic-ai/sdk';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';
import { APP, CLAUDE_MODEL } from './config.js';
import { OUTPUT_DIR, getDateLabel } from './utils.js';

export async function trackPerformance() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Falta ANTHROPIC_API_KEY en .env');
  }

  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;

  let posts;
  if (token && userId) {
    console.log('\nObteniendo métricas desde Instagram Graph API...');
    posts = await fetchInstagramMetrics(token, userId);
  } else {
    console.log('\nNo hay INSTAGRAM_ACCESS_TOKEN — usando ingreso manual.');
    console.log('Tip: copia el token de .env.local del proyecto a tu .env aquí\n');
    posts = await collectPostsInteractive();
  }

  if (!posts || posts.length === 0) {
    console.log('No hay posts para analizar.');
    return;
  }

  console.log(`\nAnalizando ${posts.length} posts con Claude...`);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `
Eres el analista de performance de ${APP.nombre} (@universidadv1).

Analiza estos posts recientes de nuestra cuenta de Instagram:
${JSON.stringify(posts, null, 2)}

Somos una app nueva para universitarios chilenos. Llevamos pocos días publicando.
Meta: crecer en seguidores y conseguir descargas de la app.

## RESUMEN DE PERFORMANCE
Tabla comparativa de los posts: qué métricas destaca cada uno.

## QUÉ FUNCIONÓ
Patrones concretos de los posts con mejor resultado (reach, saves, shares).
¿Qué tipo de contenido amplificó más el algoritmo?

## QUÉ AJUSTAR
Qué cambiar en los próximos 3 videos. Sé específico.
Ej: "El hook de 'X' tuvo baja retención — probar con Y en cambio"

## SEÑALES DEL ALGORITMO
¿El reach supera a los followers? Eso indica amplificación positiva.
¿Qué posts impulsó más Instagram?

## RECOMENDACIONES PARA LA PRÓXIMA SEMANA
3 ajustes concretos y accionables.
`.trim();

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
  });

  const analysis = response.content[0].text;

  const reportsDir = join(OUTPUT_DIR, 'briefs');
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });

  const filename = join(reportsDir, `performance-${getDateLabel()}.md`);
  writeFileSync(filename, `# Reporte de Performance — ${getDateLabel()}\n\n${analysis}\n\n---\n\n## Datos raw\n\`\`\`json\n${JSON.stringify(posts, null, 2)}\n\`\`\``);

  console.log('\n' + analysis);
  console.log(`\n✓ Reporte guardado en output/briefs/performance-${getDateLabel()}.md`);

  return { posts, analysis, filename };
}

// ─── Instagram Graph API ───────────────────────────────────────────────────────

async function fetchInstagramMetrics(token, userId) {
  const BASE = 'https://graph.instagram.com/v21.0';

  try {
    // Obtener últimos 10 posts
    const mediaRes = await fetch(
      `${BASE}/${userId}/media?fields=id,caption,media_type,timestamp,permalink&limit=10&access_token=${token}`
    );
    const mediaData = await mediaRes.json();

    if (mediaData.error) {
      console.warn('Error de API:', mediaData.error.message);
      return null;
    }

    const mediaItems = mediaData.data ?? [];
    console.log(`✓ ${mediaItems.length} posts encontrados`);

    // Obtener insights de cada post
    const posts = await Promise.all(
      mediaItems.map(async (item) => {
        const metrics = item.media_type === 'VIDEO'
          ? 'impressions,reach,likes,comments,saved,shares,plays'
          : 'impressions,reach,likes,comments,saved,shares';

        const insightsRes = await fetch(
          `${BASE}/${item.id}/insights?metric=${metrics}&access_token=${token}`
        ).catch(() => null);

        let insights = {};
        if (insightsRes?.ok) {
          const insightsData = await insightsRes.json();
          (insightsData.data ?? []).forEach(m => {
            insights[m.name] = m.values?.[0]?.value ?? m.value ?? 0;
          });
        }

        return {
          id: item.id,
          tipo: item.media_type === 'VIDEO' ? 'reel' : 'post',
          fecha: item.timestamp?.split('T')[0],
          caption: item.caption?.slice(0, 150),
          url: item.permalink,
          ...insights,
        };
      })
    );

    return posts;
  } catch (err) {
    console.warn('Error fetching Instagram API:', err.message);
    return null;
  }
}

// ─── Ingreso manual (fallback) ─────────────────────────────────────────────────

async function collectPostsInteractive() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const question = (q) => new Promise(resolve => rl.question(q, resolve));

  const posts = [];
  const count = parseInt(await question('¿Cuántos posts ingresar? ')) || 0;

  for (let i = 0; i < count; i++) {
    console.log(`\n--- POST ${i + 1} ---`);
    const post = {
      tipo: 'reel',
      titulo: await question('Descripción del video: '),
      fecha: await question('Fecha (YYYY-MM-DD): '),
      plays: parseInt(await question('Reproducciones: ')) || 0,
      reach: parseInt(await question('Alcance: ')) || 0,
      likes: parseInt(await question('Likes: ')) || 0,
      comments: parseInt(await question('Comentarios: ')) || 0,
      saved: parseInt(await question('Guardados: ')) || 0,
      shares: parseInt(await question('Compartidos: ')) || 0,
    };
    posts.push(post);
  }

  rl.close();
  return posts;
}
