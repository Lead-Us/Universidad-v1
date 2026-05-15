// POST /api/ejercicios-chat
// Body: {
//   sources: [{ title, storageUrl? } | { title, base64, mediaType }],
//   messages: [{ role: 'user'|'assistant', content }],
//   conPauta: boolean,
// }
// Returns: SSE stream → { chunk } events, then { done: true }
//
// Pipeline:
//   1. Fetch files from Supabase Storage URLs (if storageUrl provided)
//   2. Send each PDF/file to Gemini Flash for style analysis
//   3. Build Claude system prompt with Gemini's analysis
//   4. Stream Claude Sonnet 4.6 response via SSE

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_STYLE_PROMPT = `Analiza este material académico universitario chileno y extrae:

1. **tipo_preguntas**: Qué tipos de preguntas aparecen (opción múltiple, desarrollo, demostración matemática, cálculo numérico, código, etc.)
2. **notacion**: Qué notación específica usa (LaTeX, símbolos, unidades físicas, términos técnicos recurrentes)
3. **estructura_ejercicio**: Cómo está estructurado un ejercicio típico (datos dados → pedir → restricciones, etc.)
4. **dificultad**: Nivel relativo (básico / intermedio / avanzado) y extensión típica por ejercicio
5. **ejemplos**: Transcripción literal de 2-3 ejercicios representativos del material

Responde ÚNICAMENTE con JSON válido:
{
  "tipo_preguntas": "...",
  "notacion": "...",
  "estructura_ejercicio": "...",
  "dificultad": "...",
  "ejemplos": ["ejercicio 1 transcrito", "ejercicio 2 transcrito"]
}`;

function buildClaudeSystem(analyses, conPauta) {
  const analysesText = analyses
    .map((a, i) => `[Material ${i + 1}: ${a.title}]\n${JSON.stringify(a.analysis, null, 2)}`)
    .join('\n\n---\n\n');

  const pautaRule = conPauta
    ? 'Después de cada ejercicio incluye "**Pauta:**" con la solución completa paso a paso, usando la misma notación.'
    : 'Genera SOLO los enunciados numerados. NO incluyas soluciones ni pautas.';

  return `Eres un generador experto de ejercicios académicos universitarios chilenos.

Se te proporciona un análisis del estilo del material del alumno. Tu tarea es generar ejercicios NUEVOS que sigan EXACTAMENTE ese mismo patrón:
- Mismo tipo de preguntas y estructura de enunciado
- Misma notación matemática o técnica
- Misma dificultad relativa
- Datos, valores y variables completamente distintos al material original

Análisis del material disponible:
${analysesText}

Reglas de formato:
- Numera cada ejercicio: **Ejercicio 1**, **Ejercicio 2**, etc.
- Usa LaTeX para matemáticas: $formula$ o $$formula$$ según aplique
- Lenguaje académico formal en español
- Sin emojis
- Sin preámbulos ("¡Claro!", "Por supuesto", etc.)
- ${pautaRule}

Si el alumno pide la solución de un ejercicio específico, respóndela con el mismo nivel de detalle que se vería en una pauta oficial.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sources = [], messages = [], conPauta = false } = req.body ?? {};

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey    = process.env.GEMINI_API_KEY;
  const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada' });
  if (!geminiKey)    return res.status(500).json({ error: 'GEMINI_API_KEY no configurada' });

  // ── Step 1: Fetch files from Storage URLs if needed ──────────────────────
  const resolvedSources = await Promise.all(
    sources.map(async (src) => {
      if (src.base64) return src;
      if (src.storageUrl) {
        try {
          const fetchHeaders = {};
          if (supabaseKey && src.storageUrl.includes('supabase')) {
            fetchHeaders['Authorization'] = `Bearer ${supabaseKey}`;
            fetchHeaders['apikey'] = supabaseKey;
          }
          const resp = await fetch(src.storageUrl, { headers: fetchHeaders });
          if (!resp.ok) return null;
          const buf    = await resp.arrayBuffer();
          const base64 = Buffer.from(buf).toString('base64');
          const ct     = resp.headers.get('content-type') || 'application/pdf';
          return { title: src.title, base64, mediaType: ct };
        } catch { return null; }
      }
      return null;
    })
  );

  const validSources = resolvedSources.filter(Boolean);

  // ── Step 2: Analyze each file with Gemini Flash ───────────────────────────
  const genAI        = new GoogleGenerativeAI(geminiKey);
  const geminiModel  = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const analyses     = [];

  for (const src of validSources) {
    let analyzed = false;
    for (let attempt = 0; attempt < 2 && !analyzed; attempt++) {
      try {
        const result = await geminiModel.generateContent([
          {
            inlineData: {
              mimeType: src.mediaType || 'application/pdf',
              data:     src.base64,
            },
          },
          GEMINI_STYLE_PROMPT,
        ]);
        const raw  = result.response.text().trim();
        const json = raw.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1]?.trim() ?? raw;
        analyses.push({ title: src.title, analysis: JSON.parse(json) });
        analyzed = true;
      } catch (err) {
        console.warn(`[ejercicios-chat] Gemini attempt ${attempt + 1} failed for "${src.title}":`, err.message);
        if (attempt === 0) await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  // ── Step 3: Build Claude messages ────────────────────────────────────────
  const client      = new Anthropic({ apiKey: anthropicKey });
  const systemPrompt = buildClaudeSystem(analyses, conPauta);

  const anthropicMessages = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }));

  if (anthropicMessages.length === 0 || anthropicMessages.at(-1).role !== 'user') {
    const defaultPrompt = analyses.length > 0
      ? `Genera 8 ejercicios nuevos que sigan exactamente el estilo del material analizado.${conPauta ? ' Incluye la pauta de cada uno.' : ''}`
      : `Genera 8 ejercicios de práctica académica universitaria de dificultad media.${conPauta ? ' Incluye la pauta de cada uno.' : ''}`;
    anthropicMessages.push({ role: 'user', content: defaultPrompt });
  }

  // ── Step 4: Stream Claude response via SSE ────────────────────────────────
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = client.messages.stream({
      model:      'claude-sonnet-4-6',
      max_tokens: 6000,
      system:     systemPrompt,
      messages:   anthropicMessages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ chunk: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('[ejercicios-chat] Claude error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message || 'Error al generar ejercicios' });
    }
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}
