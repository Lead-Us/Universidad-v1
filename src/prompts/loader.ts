import { readFileSync } from 'fs';
import { join } from 'path';

export type MethodKey =
  | 'herrera_aprender'
  | 'herrera_practicar'
  | 'mate_flash'
  | 'mate_practica';

const METHOD_FILES: Record<MethodKey, string> = {
  herrera_aprender:  '01_HERRERA_APRENDER.md',
  herrera_practicar: '02_HERRERA_PRACTICAR.md',
  mate_flash:        '03_MATEMATICO_FLASH.md',
  mate_practica:     '04_MATEMATICO_PRACTICA_FULL.md',
};

const PROMPTS_DIR = join(process.cwd(), 'Aprender modelos');

/**
 * Reads 00_BASE_PROMPT.md and concatenates the method file for methodKey,
 * separated by `\n\n---\n\n`. Returns the full string ready to inject
 * as the `system` field in the Anthropic Messages API.
 */
export function buildSystemPrompt(methodKey: MethodKey): string {
  const base   = readFileSync(join(PROMPTS_DIR, '00_BASE_PROMPT.md'), 'utf8');
  const method = readFileSync(join(PROMPTS_DIR, METHOD_FILES[methodKey]), 'utf8');
  return `${base}\n\n---\n\n${method}`;
}
