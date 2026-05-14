// Builds system prompts for the pedagogical chat API.
// Reads prompt files from "Cerebro Aprender/" at project root.

import { readFileSync } from 'fs';
import { join } from 'path';

const CEREBRO_DIR = join(process.cwd(), 'Cerebro Aprender');

function read(filename) {
  return readFileSync(join(CEREBRO_DIR, filename), 'utf8');
}

/**
 * Plan generation prompt: base + conductor/plan + all 4 teaching methods.
 * Used for the first message when the student presses "Generar plan".
 * The conductor detects the discipline, generates the plan, and starts teaching.
 */
export function buildPlanPrompt() {
  return [
    read('00_BASE_EXAMEN.md'),
    read('06_CONDUCTOR_PLAN.md'),
    read('02_METODO_INGENIERIAS.md'),
    read('03_METODO_DERECHO_SOCIAL.md'),
    read('04_METODO_MEDICINA_SALUD.md'),
    read('05_METODO_NEGOCIOS_ECONOMIA.md'),
  ].join('\n\n---\n\n');
}

/**
 * Conductor prompt: base + all 4 teaching methods.
 * Used for all subsequent messages after the plan is generated.
 */
export function buildConductorPrompt() {
  return [
    read('00_BASE_EXAMEN.md'),
    read('02_METODO_INGENIERIAS.md'),
    read('03_METODO_DERECHO_SOCIAL.md'),
    read('04_METODO_MEDICINA_SALUD.md'),
    read('05_METODO_NEGOCIOS_ECONOMIA.md'),
  ].join('\n\n---\n\n');
}
