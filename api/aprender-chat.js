// POST /api/aprender-chat
// Body: { sources, messages, blockMemory, projectMemory, planMode? }
// Returns: SSE stream → { chunk } events, then final { done, blockMemory, projectMemory }
// Uses Anthropic claude-sonnet-4-6 via ANTHROPIC_API_KEY_APRENDER

import Anthropic from '@anthropic-ai/sdk';
import { buildConductorPrompt, buildPlanPrompt } from './_prompts.js';

const BLOCK_MEMORY_PROMPT = `Eres un sistema de memoria pedagógica. Analiza la conversación y genera un párrafo breve (máx 200 palabras) que resuma:
- Conceptos que el estudiante ya demostró entender
- Dificultades o confusiones recurrentes
- Preferencias de aprendizaje observadas

Responde SOLO con el párrafo de memoria, sin títulos ni formato adicional. Si no hay suficiente información, responde con una cadena vacía.`;

const PROJECT_MEMORY_PROMPT = `Eres un sistema de memoria pedagógica. Basándote en la memoria de bloque y el historial, genera un párrafo breve (máx 150 palabras) que resuma el estado de aprendizaje general del cuaderno:
- Temas cubiertos y nivel de dominio
- Brechas de conocimiento identificadas
- Progreso global

Responde SOLO con el párrafo de resumen, sin títulos. Si no hay suficiente información, responde con una cadena vacía.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    sources = [],
    messages = [],
    blockMemory = '',
    projectMemory = '',
    planMode = false,
  } = req.body ?? {};

  const apiKey = process.env.ANTHROPIC_API_KEY_APRENDER || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY_APRENDER not configured' });
  }

  const client = new Anthropic({ apiKey });

  // Build pedagogical system prompt from .md files
  const systemBase = planMode ? buildPlanPrompt() : buildConductorPrompt();

  // Append student material as context
  const sourcesText = sources
    .filter(s => s.content)
    .map((s, i) => {
      const header = `[Fuente ${i + 1}: ${s.title}]`;
      const instrNote = s.instructions ? `\nInstrucciones para esta fuente: ${s.instructions}` : '';
      return `${header}${instrNote}\n${s.content}`;
    })
    .join('\n\n---\n\n');

  const memorySection = [
    blockMemory   ? `MEMORIA DE ESTE BLOQUE (lo que ya sabes sobre este estudiante aquí):\n${blockMemory}` : '',
    projectMemory ? `CONTEXTO GENERAL DEL CUADERNO:\n${projectMemory}` : '',
  ].filter(Boolean).join('\n\n');

  const systemPrompt = [
    systemBase,
    sourcesText   ? `---\n\nMaterial de estudio disponible:\n\n${sourcesText}` : '',
    memorySection ? `---\n\n${memorySection}` : '',
  ].filter(Boolean).join('\n\n');

  // Convert messages to Anthropic format
  const anthropicMessages = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }));

  // Ensure conversation ends with a user message
  if (anthropicMessages.length === 0 || anthropicMessages[anthropicMessages.length - 1].role !== 'user') {
    anthropicMessages.push({
      role: 'user',
      content: 'Genera el material de estudio basado en las fuentes y el método seleccionado.',
    });
  }

  try {
    // ── SSE headers ───────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // ── Stream main AI response ───────────────────────────────────
    let reply = '';
    const stream = client.messages.stream({
      model:      'claude-sonnet-4-6',
      max_tokens: 5000,
      system:     systemPrompt,
      messages:   anthropicMessages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        const chunk = event.delta.text;
        reply += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
    }

    // ── Memory update (skip in planMode — it's the first message) ────
    let newBlockMemory   = blockMemory;
    let newProjectMemory = projectMemory;

    if (!planMode && messages.length >= 2) {
      const conversationText = messages
        .slice(-10)
        .map(m => `${m.role === 'user' ? 'Estudiante' : 'IA'}: ${m.content}`)
        .join('\n\n');

      const memContext = blockMemory ? `Memoria previa:\n${blockMemory}\n\n` : '';

      try {
        const blockRes = await client.messages.create({
          model:      'claude-haiku-4-5-20251001',
          max_tokens: 400,
          system:     BLOCK_MEMORY_PROMPT,
          messages:   [{ role: 'user', content: `${memContext}Conversación:\n\n${conversationText}` }],
        });
        const generated = blockRes.content?.[0]?.text?.trim() ?? '';
        if (generated) newBlockMemory = generated;
      } catch { /* non-critical */ }

      if (newBlockMemory && newBlockMemory !== blockMemory) {
        const projContext = projectMemory ? `Memoria general previa:\n${projectMemory}\n\n` : '';
        try {
          const projRes = await client.messages.create({
            model:      'claude-haiku-4-5-20251001',
            max_tokens: 300,
            system:     PROJECT_MEMORY_PROMPT,
            messages:   [{ role: 'user', content: `${projContext}Nueva memoria del bloque:\n${newBlockMemory}` }],
          });
          const generated = projRes.content?.[0]?.text?.trim() ?? '';
          if (generated) newProjectMemory = generated;
        } catch { /* non-critical */ }
      }
    }

    // ── Final event with memory ───────────────────────────────────
    res.write(`data: ${JSON.stringify({ done: true, blockMemory: newBlockMemory, projectMemory: newProjectMemory })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Anthropic API error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message || 'Error al generar respuesta' });
    }
    res.write(`data: ${JSON.stringify({ error: err.message || 'Error al generar respuesta' })}\n\n`);
    res.end();
  }
}
