/**
 * run.js — CLI principal del agente Instagram @universidadv1
 *
 * Comandos:
 *   node run.js weekly    → flujo completo semanal (scrape + analyze + generate)
 *   node run.js scrape    → solo scraping de Instagram via Apify
 *   node run.js analyze   → solo análisis de datos scrapeados con Claude
 *   node run.js generate  → solo generación de ideas y scripts
 *   node run.js track     → ingresar métricas y obtener análisis de performance
 *   node run.js help      → mostrar ayuda
 */

import 'dotenv/config';
import { scrapeInstagram } from './scraper.js';
import { analyzeScrapedData } from './analyzer.js';
import { generateIdeasAndScripts } from './generator.js';
import { trackPerformance } from './tracker.js';
import { getWeekLabel } from './utils.js';

const COMMANDS = {
  weekly:   runWeekly,
  scrape:   runScrape,
  analyze:  runAnalyze,
  generate: runGenerate,
  track:    runTrack,
  help:     showHelp,
};

async function main() {
  const cmd = process.argv[2] ?? 'help';

  if (!COMMANDS[cmd]) {
    console.error(`Comando desconocido: "${cmd}"`);
    showHelp();
    process.exit(1);
  }

  printBanner(cmd);
  await COMMANDS[cmd]();
}

// ─── Comandos ─────────────────────────────────────────────────────────────────

async function runWeekly() {
  console.log(`Ejecutando flujo completo para ${getWeekLabel()}...\n`);

  // 1. Scraping
  console.log('PASO 1/3: Scraping de tendencias');
  const scrapedData = await scrapeInstagram().catch(err => {
    console.warn('Scraping falló, continuando con análisis base:', err.message);
    return null;
  });

  // 2. Análisis
  console.log('\nPASO 2/3: Análisis de patrones');
  const { analysis } = await analyzeScrapedData(scrapedData);

  // 3. Generación de ideas + scripts
  console.log('\nPASO 3/3: Generación de ideas y scripts');
  const { briefFile } = await generateIdeasAndScripts(analysis);

  console.log('\n─────────────────────────────────────────');
  console.log('LISTO — Brief semanal generado');
  console.log(`Abre: ${briefFile}`);
  console.log('─────────────────────────────────────────');
}

async function runScrape() {
  await scrapeInstagram();
}

async function runAnalyze() {
  await analyzeScrapedData();
}

async function runGenerate() {
  await generateIdeasAndScripts();
}

async function runTrack() {
  await trackPerformance();
}

function showHelp() {
  console.log(`
Agente Instagram @universidadv1
────────────────────────────────────────────

COMANDOS:
  node run.js weekly    Flujo completo semanal (recomendado: cada lunes)
                        Scraping → Análisis → Ideas + Scripts

  node run.js scrape    Solo scraping de Instagram (requiere APIFY_API_KEY)
  node run.js analyze   Solo análisis de datos esta semana
  node run.js generate  Solo generación de ideas y scripts
  node run.js track     Ingresar métricas de posts y obtener análisis

CONFIGURACIÓN:
  1. Copia .env.example → .env
  2. Completa ANTHROPIC_API_KEY y APIFY_API_KEY
  3. npm install

OUTPUTS:
  output/briefs/brief-[semana].md       → Ideas + scripts de la semana
  output/briefs/analysis-[semana].md    → Análisis de tendencias
  output/briefs/performance-[fecha].md  → Reporte de performance
  output/scripts/scripts-[semana].md    → Scripts para el editor
  output/data/scraped-[semana].json     → Data cruda de Apify

FLUJO SEMANAL RECOMENDADO:
  Lunes AM   → node run.js weekly  (genera el brief)
  Mar-Mié    → Grabar los 3 videos según scripts
  Jue-Sáb    → Publicar (1 por día)
  Dom        → node run.js track   (ingresar métricas, obtener análisis)
`.trim());
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

function printBanner(cmd) {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║   Agente Instagram @universidadv1    ║');
  console.log(`║   Comando: ${cmd.padEnd(26)}║`);
  console.log('╚══════════════════════════════════════╝');
  console.log('');
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
