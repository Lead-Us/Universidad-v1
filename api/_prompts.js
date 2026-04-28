// Builds system prompts for the pedagogical chat API.
// Reads prompt files from "Aprender modelos/" at project root.

import { readFileSync } from 'fs';
import { join } from 'path';

const PROMPTS_DIR = join(process.cwd(), 'Aprender modelos');

function read(filename) {
  return readFileSync(join(PROMPTS_DIR, filename), 'utf8');
}

/**
 * Full conductor prompt: base rules + conductor + all 5 teaching methods.
 * Used for all regular chat messages after the study plan is generated.
 */
export function buildConductorPrompt() {
  return [
    read('00_BASE_PROMPT.md'),
    read('06_CONDUCTOR.md'),
    read('01_HERRERA_COMPLETO.md'),
    read('02_MATEMATICO.md'),
    read('03_TECNICO_MEMORIZACION.md'),
    read('04_HISTORIA_HUMANIDADES.md'),
    read('05_IDIOMAS.md'),
  ].join('\n\n---\n\n');
}

/**
 * Plan generation prompt: used only for the first message when the student
 * requests a study plan. Returns a structured topic roadmap.
 */
export function buildPlanPrompt() {
  return [
    read('00_BASE_PROMPT.md'),
    read('07_PLAN_GENERATOR.md'),
  ].join('\n\n---\n\n');
}

// Legacy alias — kept for any other endpoints that may import this
export function buildSystemPrompt() {
  return buildConductorPrompt();
}
