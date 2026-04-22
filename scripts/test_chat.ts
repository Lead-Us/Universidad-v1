/**
 * Integration test for the pedagogical prompt system.
 * Run with: npx tsx scripts/test_chat.ts
 * Requires ANTHROPIC_API_KEY_APRENDER or ANTHROPIC_API_KEY in environment.
 */

import 'dotenv/config';
import { buildSystemPrompt, type MethodKey } from '../src/prompts/loader.js';
import { sendMessage } from '../src/chat/session.js';

const METHODS: MethodKey[] = [
  'herrera_aprender',
  'herrera_practicar',
  'mate_flash',
  'mate_practica',
];

// ── Test 1: buildSystemPrompt ────────────────────────────────────
console.log('\n=== Test 1: buildSystemPrompt ===\n');
for (const key of METHODS) {
  const prompt = buildSystemPrompt(key);
  const lines  = prompt.split('\n').length;
  const hasBase   = prompt.includes('ROL Y PROPÓSITO');
  const hasSep    = prompt.includes('\n\n---\n\n');
  const hasMethod = prompt.includes('MÉTODO ACTIVO');
  const ok = hasBase && hasSep && hasMethod;
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${key} — ${lines} líneas, base=${hasBase}, sep=${hasSep}, method=${hasMethod}`);
}

// ── Test 2: sendMessage (requires valid API key) ─────────────────
const RUN_API_TEST = Boolean(
  process.env.ANTHROPIC_API_KEY_APRENDER ?? process.env.ANTHROPIC_API_KEY
);

if (!RUN_API_TEST) {
  console.log('\n=== Test 2: sendMessage — OMITIDO (sin API key) ===\n');
  process.exit(0);
}

console.log('\n=== Test 2: sendMessage (herrera_aprender) ===\n');

const reply = await sendMessage({
  methodKey:   'herrera_aprender',
  userMessage: 'Quiero estudiar el concepto de oferta y demanda en economía.',
  sources: [
    {
      title:   'Apunte de clase',
      content: 'La ley de la demanda establece que a mayor precio, menor cantidad demandada. La curva de demanda tiene pendiente negativa. La oferta representa la cantidad que los productores están dispuestos a vender a cada precio.',
    },
  ],
});

console.log('Respuesta recibida:\n');
console.log(reply);
console.log(`\n— Tokens aprox: ${reply.split(' ').length} palabras`);
