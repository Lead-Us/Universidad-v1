// Builds system prompts for the pedagogical chat API.
// Reads prompt files from "Aprender modelos/" and "Cerebro Aprender/" at project root.

import { readFileSync } from 'fs';
import { join } from 'path';

const PROMPTS_DIR  = join(process.cwd(), 'Aprender modelos');
const CEREBRO_DIR  = join(process.cwd(), 'Cerebro Aprender');

function read(filename) {
  return readFileSync(join(PROMPTS_DIR, filename), 'utf8');
}

function readCerebro(filename) {
  return readFileSync(join(CEREBRO_DIR, filename), 'utf8');
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

/**
 * Exam-tutor conductor prompt: base exam rules + conductor + all 4 discipline methods.
 * Used when auto-detection identifies exam context in the uploaded sources.
 */
export function buildExamConductorPrompt() {
  return [
    readCerebro('00_BASE_EXAMEN.md'),
    readCerebro('06_CONDUCTOR_EXAMEN.md'),
    readCerebro('02_METODO_INGENIERIAS.md'),
    readCerebro('03_METODO_DERECHO_SOCIAL.md'),
    readCerebro('04_METODO_MEDICINA_SALUD.md'),
    readCerebro('05_METODO_NEGOCIOS_ECONOMIA.md'),
    readCerebro('01_DETECTOR_EXAMEN.md'),
  ].join('\n\n---\n\n');
}

/**
 * Exam study plan prompt: base exam rules + exam plan generator.
 * Used for the first message when exam context is detected and planMode is true.
 */
export function buildExamPlanPrompt() {
  return [
    readCerebro('00_BASE_EXAMEN.md'),
    readCerebro('07_PLAN_EXAMEN.md'),
  ].join('\n\n---\n\n');
}
