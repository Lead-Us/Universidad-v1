/**
 * scraper.js — Investigación de tendencias 100% gratis, sin API keys
 *
 * Fuentes:
 *   1. Reddit JSON API — pain points reales de estudiantes chilenos
 *      (r/chile, r/Universitarios, r/ingenieria — sin key, sin auth)
 *   2. DuckDuckGo HTML search — reels trending de universitarios
 *      (sin key, sin cuenta)
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { OUTPUT_DIR, getWeekLabel, truncate } from './utils.js';

// ─── Config de fuentes ────────────────────────────────────────────────────────

// restrict_sr=on → busca SOLO dentro del subreddit indicado
const REDDIT_SOURCES = [
  { url: 'https://www.reddit.com/r/chile/search.json?q=universidad+ramos+notas&sort=top&t=month&limit=20&restrict_sr=on', label: 'r/chile — universidad' },
  { url: 'https://www.reddit.com/r/chile/search.json?q=semestre+prueba+carrera&sort=top&t=month&limit=20&restrict_sr=on', label: 'r/chile — semestre' },
  { url: 'https://www.reddit.com/r/chile/search.json?q=aplicacion+app+organizar&sort=top&t=year&limit=15&restrict_sr=on', label: 'r/chile — apps' },
  { url: 'https://www.reddit.com/r/Universitarios/top.json?t=month&limit=25', label: 'r/Universitarios — top' },
  { url: 'https://www.reddit.com/r/Universitarios/search.json?q=notas+ramos+organización&sort=top&t=month&limit=20&restrict_sr=on', label: 'r/Universitarios — organización' },
  { url: 'https://www.reddit.com/r/ingenieria/top.json?t=month&limit=15', label: 'r/ingenieria — top' },
  { url: 'https://www.reddit.com/r/ingenieria/search.json?q=ramos+notas+reprobado&sort=top&t=year&limit=15&restrict_sr=on', label: 'r/ingenieria — ramos' },
];

// Brave Search API: 2000 búsquedas gratis/mes (https://api.search.brave.com/)
// Si no hay BRAVE_API_KEY, el scraper igual funciona (solo con Reddit)
const SEARCH_QUERIES = [
  'instagram reels universitarios chile app',
  'tiktok estudiantes universitarios organización viral',
  'videos universitarios chilenos redes sociales',
];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; content-research-bot/1.0)',
};

// ─── Función principal ────────────────────────────────────────────────────────

export async function scrapeInstagram() {
  console.log('\nInvestigando tendencias (fuentes gratuitas)...\n');

  const [redditData, searchData] = await Promise.allSettled([
    scrapeReddit(),
    searchWeb(),
  ]);

  const reddit = redditData.status === 'fulfilled' ? redditData.value : { posts: [], error: redditData.reason?.message };
  const search = searchData.status === 'fulfilled' ? searchData.value : { results: [], error: searchData.reason?.message };

  const data = {
    scrapedAt: new Date().toISOString(),
    week: getWeekLabel(),
    source: 'free (reddit + duckduckgo)',
    totals: {
      redditPosts: reddit.posts?.length ?? 0,
      searchResults: search.results?.length ?? 0,
    },
    reddit: reddit.posts ?? [],
    search: search.results ?? [],
    errors: [reddit.error, search.error].filter(Boolean),
  };

  const dataDir = join(OUTPUT_DIR, 'data');
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

  const filename = join(dataDir, `scraped-${getWeekLabel()}.json`);
  writeFileSync(filename, JSON.stringify(data, null, 2));

  console.log(`✓ Reddit: ${data.totals.redditPosts} posts encontrados`);
  console.log(`✓ Web search: ${data.totals.searchResults} resultados`);
  console.log(`✓ Guardado en output/data/scraped-${getWeekLabel()}.json`);

  if (data.errors.length) {
    console.warn('Advertencias:', data.errors.join(' | '));
  }

  printSample(data.reddit);
  return data;
}

// ─── Reddit JSON API ──────────────────────────────────────────────────────────
// Sin key, sin auth. Reddit expone .json en cualquier URL pública.

async function scrapeReddit() {
  const allPosts = [];

  for (const source of REDDIT_SOURCES) {
    try {
      const res = await fetch(source.url, { headers: HEADERS });
      if (!res.ok) {
        console.warn(`  Reddit ${source.label}: HTTP ${res.status}`);
        continue;
      }
      const json = await res.json();
      const posts = (json?.data?.children ?? []).map(c => normalizeRedditPost(c.data, source.label));
      allPosts.push(...posts);
      console.log(`  ✓ ${source.label}: ${posts.length} posts`);

      // Pausa breve para no saturar Reddit
      await sleep(500);
    } catch (err) {
      console.warn(`  Reddit ${source.label}: ${err.message}`);
    }
  }

  // Deduplicar por ID
  const unique = [...new Map(allPosts.map(p => [p.id, p])).values()];

  // Filtrar solo posts en español — palabras exclusivamente portuguesas
  const PT_ONLY = /\b(não|você|vocês|isso|aqui|nossa|mas sim|kkk|kk|hein|né|né\?|pois|então|também|também|tá bom|tudo bem)\b/i;
  const filtered = unique.filter(p => {
    const text = (p.title + ' ' + (p.selftext ?? '')).toLowerCase();
    return !PT_ONLY.test(text);
  });

  // Ordenar por upvotes
  filtered.sort((a, b) => b.score - a.score);

  return { posts: filtered };
}

function normalizeRedditPost(p, source) {
  return {
    id: p.id,
    source,
    title: p.title,
    selftext: truncate(p.selftext, 400),
    score: p.score,
    comments: p.num_comments,
    url: `https://reddit.com${p.permalink}`,
    subreddit: p.subreddit,
    created: new Date(p.created_utc * 1000).toISOString().split('T')[0],
    flair: p.link_flair_text ?? null,
  };
}

// ─── Web search ───────────────────────────────────────────────────────────────
// Usa Brave Search API si hay BRAVE_API_KEY (2000/mes gratis)
// Si no, devuelve vacío y Claude trabaja solo con Reddit data

async function searchWeb() {
  const braveKey = process.env.BRAVE_API_KEY;

  if (!braveKey) {
    console.log('  (Sin BRAVE_API_KEY — web search omitida, usando solo Reddit)');
    return { results: [] };
  }

  const results = [];

  for (const query of SEARCH_QUERIES) {
    try {
      const encoded = encodeURIComponent(query);
      const res = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encoded}&count=5&country=cl&search_lang=es`,
        {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': braveKey,
          },
        }
      );

      if (!res.ok) {
        console.warn(`  Brave "${query}": HTTP ${res.status}`);
        continue;
      }

      const json = await res.json();
      const webResults = json?.web?.results ?? [];
      webResults.forEach(r => {
        results.push({
          query,
          title: r.title,
          url: r.url,
          snippet: truncate(r.description ?? '', 200),
        });
      });

      console.log(`  ✓ Brave Search "${query}": ${webResults.length} resultados`);
      await sleep(300);
    } catch (err) {
      console.warn(`  Brave Search "${query}": ${err.message}`);
    }
  }

  return { results };
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function printSample(posts) {
  if (!posts.length) return;
  console.log('\nTop 5 posts de Reddit (por relevancia):');
  posts.slice(0, 5).forEach((p, i) => {
    console.log(`  ${i + 1}. [${p.score} upvotes] ${p.title}`);
    console.log(`     ${p.url}`);
  });
}
