// POST /api/aprender-chat
// Body: { sources, messages, blockMemory, projectMemory, planMode? }
// Returns: SSE stream → { chunk } events, then final { done, blockMemory, projectMemory }
// Pipeline: Gemini extracts content from uploaded files → Claude generates response

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildConductorPrompt, buildPlanPrompt, buildExamConductorPrompt, buildExamPlanPrompt } from './_prompts.js';

const GEMINI_EXTRACT_PROMPT = `Extrae TODO el contenido de texto de este documento académico, preservando:
- Estructura de secciones y subsecciones
- Fórmulas matemáticas (usa notación LaTeX)
- Definiciones, teoremas y conceptos clave
- Ejemplos y ejercicios
- Tablas y datos

Responde con el contenido extraído de forma organizada. No resumas, extrae el texto completo.`;

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

/**
 * Scans uploaded sources and the last user message for exam context signals.
 * Returns true if the confidence score reaches threshold (≥ 2).
 */
function detectExamContext(sources, messages) {
  let score = 0;

  const examTitleRe = /\b(control|examen|prueba|certamen|pauta|evaluaci[oó]n|midterm|quiz|final)\b/i;
  const pointsRe    = /\(\s*\d+\s*(puntos?|pts?|ptos?)\s*\)|\[\s*\d+\s*(pts?|ptos?)\s*\]|puntaje\s*:/i;
  const durationRe  = /\b(tiempo\s*:?\s*\d+\s*min|duraci[oó]n\s*:|tiempo\s+disponible)/i;
  const rubricRe    = /tabla\s+de\s+puntajes?|r[uú]brica\s+de\s+evaluaci[oó]n/i;
  const altRe       = /\b(alternativas?|opciones?)\s*[\:\n]?\s*\n?\s*(a[\.\)]\s|b[\.\)]\s|i\.\s|ii\.\s)/i;

  const guideTitleRe = /\b(gu[íi]a\s+de\s+(ejercicios?|problemas?)|taller|hoja\s+de\s+trabajo|problemario)\b/i;
  const devRe        = /muestre\s+su\s+desarrollo|desarrolle|justifique\s+su\s+respuesta/i;
  const enunciadoRe  = /un[ao]?\s+\w+\s+(tiene|debe|realiza|posee|decide)\b.*\?/i;

  for (const source of sources) {
    const text  = (source.content || '').substring(0, 8000);
    const title = (source.title   || '').toLowerCase();

    if (examTitleRe.test(title) || examTitleRe.test(text.substring(0, 300))) score += 1;
    if (pointsRe.test(text))  score += 1;
    if (durationRe.test(text)) score += 1;
    if (rubricRe.test(text))  score += 1;
    if (altRe.test(text))     score += 1;

    if (guideTitleRe.test(title) || guideTitleRe.test(text.substring(0, 300))) score += 1;
    if (devRe.test(text))      score += 1;
    if (enunciadoRe.test(text)) score += 1;

    const numberedCount = (text.match(/^\s*\d+[\.\)]\s+/mg) || []).length;
    const formulaRe = /[∫∑∏√∂∆αβγλμσ]|\\frac|\\int|\\sum|\bN[°º]\s*\d|\bArt[°º\.]?\s*\d|\bArt[íi]culo\s+\d/i;
    if (numberedCount >= 3 && formulaRe.test(text)) score += 1;
  }

  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  if (lastUserMsg) {
    const urgencyRe = /tengo\s+un[ao]?\s+(prueba|control|certamen|examen)|es\s+para\s+(ma[nñ]ana|hoy)|en\s+\d+\s+(horas?|minutos?)|no\s+entiendo\s+nada|parto\s+de\s+cero|nunca\s+estudi[eé]/i;
    if (urgencyRe.test(lastUserMsg.content)) score += 2;
  }

  return score >= 2;
}

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
  const geminiKey = process.env.GEMINI_API_KEY;

  // ── Step 1: Process file sources with Gemini ──────────────────────
  const enrichedSources = [];

  for (const src of sources) {
    // If source has a storageUrl, fetch and process with Gemini
    if (src.storageUrl && geminiKey) {
      try {
        const resp = await fetch(src.storageUrl);
        if (resp.ok) {
          const buf = await resp.arrayBuffer();
          const base64 = Buffer.from(buf).toString('base64');
          const ct = resp.headers.get('content-type') || 'application/pdf';

          const genAI = new GoogleGenerativeAI(geminiKey);
          const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
          const result = await geminiModel.generateContent([
            { inlineData: { mimeType: ct, data: base64 } },
            GEMINI_EXTRACT_PROMPT,
          ]);
          const extractedText = result.response.text().trim();
          enrichedSources.push({ title: src.title, content: extractedText });
          continue;
        }
      } catch (err) {
        console.warn(`[aprender-chat] Gemini extraction failed for "${src.title}":`, err.message);
      }
    }

    // Fallback: use existing text content
    if (src.content) {
      enrichedSources.push({ title: src.title, content: src.content });
    }
  }

  // Auto-detect exam context from sources and message urgency signals.
  const isExamContext = detectExamContext(enrichedSources, messages);

  let systemBase;
  if (isExamContext && planMode)  systemBase = buildExamPlanPrompt();
  else if (isExamContext)          systemBase = buildExamConductorPrompt();
  else if (planMode)               systemBase = buildPlanPrompt();
  else                             systemBase = buildConductorPrompt();

  // Append student material as context
  const sourcesText = enrichedSources
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
