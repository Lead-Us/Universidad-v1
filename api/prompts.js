// Builds the system prompt for the pedagogical chat API.
// Reads base prompt + method file from "Aprender modelos/" at project root.

import { readFileSync } from 'fs';
import { join } from 'path';

const PROMPTS_DIR = join(process.cwd(), 'Aprender modelos');

const METHOD_FILES = {
  herrera_aprender:       '01_HERRERA_APRENDER.md',
  herrera_practicar:      '02_HERRERA_PRACTICAR.md',
  mate_flash:             '03_MATEMATICO_FLASH.md',
  mate_practica:          '04_MATEMATICO_PRACTICA_FULL.md',
};

/**
 * Reads 00_BASE_PROMPT.md and concatenates the method file for methodKey.
 * Returns the full system prompt string ready for injection into the Anthropic API.
 * If methodKey is unknown or empty, returns only the base prompt.
 */
export function buildSystemPrompt(methodKey = '') {
  const base = readFileSync(join(PROMPTS_DIR, '00_BASE_PROMPT.md'), 'utf8');
  const methodFile = METHOD_FILES[methodKey];
  if (!methodFile) return base;
  const method = readFileSync(join(PROMPTS_DIR, methodFile), 'utf8');
  return `${base}\n\n---\n\n${method}`;
}
