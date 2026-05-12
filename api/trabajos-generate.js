// POST /api/trabajos-generate
// Body: {
//   titulo: string,
//   tipo: 'pdf'|'docx'|'pptx',
//   plantilla: 'informe_lab'|'ensayo'|'presentacion'|'informe_general'|'libre',
//   instruccionesTexto: string,
//   instruccionesArchivo: { title, storageUrl? } | { title, base64, mediaType } | null,
//   materialRamo: [{ title, storageUrl? } | { title, base64, mediaType }],
// }
// Returns: SSE stream → { chunk } events (markdown or JSON), then { done: true, tipo }
//
// Pipeline:
//   1. Fetch files from Supabase Storage URLs
//   2. Gemini Flash analyzes instruction file + material → extracts requirements
//   3. Claude generates content in SSE:
//      - pdf/docx: markdown with ## sections
//      - pptx: JSON { slides: [...] }

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PLANTILLAS = {
  informe_lab: `Estructura obligatoria para Informe de Laboratorio:
1. Portada (título, ramo, profesor, fecha, integrantes)
2. Resumen (máx 150 palabras)
3. Objetivos (general y específicos)
4. Marco Teórico (fundamentos relevantes al experimento)
5. Materiales y Equipos
6. Metodología / Procedimiento
7. Resultados (datos, tablas, gráficos si aplica)
8. Análisis y Discusión
9. Conclusiones
10. Referencias`,

  ensayo: `Estructura obligatoria para Ensayo Académico:
1. Introducción (contexto, tesis principal, estructura del ensayo)
2. Argumento 1 (con evidencia y análisis)
3. Argumento 2 (con evidencia y análisis)
4. Argumento 3 (con evidencia y análisis)
5. Contraargumento y Refutación
6. Conclusión (síntesis y reflexión final)
7. Referencias bibliográficas`,

  presentacion: `Estructura para Presentación Académica (formato JSON de slides):
- Slide 1: Portada (título, subtítulo, autores, ramo)
- Slide 2: Agenda / Índice
- Slides 3-N: Contenido organizado por secciones (max 5 bullets por slide)
- Penúltimo slide: Conclusiones y hallazgos clave
- Último slide: Preguntas / Referencias
Total: entre 8 y 15 slides`,

  informe_general: `Estructura para Informe General:
1. Portada
2. Resumen Ejecutivo (máx 200 palabras)
3. Antecedentes y Contexto
4. Desarrollo (dividido en secciones según tema)
5. Análisis Crítico
6. Recomendaciones (si aplica)
7. Conclusiones
8. Referencias`,

  libre: 'Sin estructura predefinida. Sigue las instrucciones del alumno.',
};

const GEMINI_REQUIREMENTS_PROMPT = `Analiza este documento académico y extrae los requisitos principales:

1. **objetivo**: ¿Qué debe hacer el trabajo? (en 1-2 oraciones)
2. **secciones_requeridas**: Lista de secciones o contenidos que se exigen explícitamente
3. **criterios**: Criterios de evaluación o aspectos a considerar
4. **extension**: Extensión, número de páginas o slides si se menciona
5. **contenido_clave**: Los conceptos, datos o información relevante del material que debe usarse

Responde ÚNICAMENTE con JSON válido:
{
  "objetivo": "...",
  "secciones_requeridas": ["...", "..."],
  "criterios": ["...", "..."],
  "extension": "...",
  "contenido_clave": "..."
}`;

function buildDocumentPrompt(titulo, tipo, plantilla, requirements, instrucciones) {
  const plantillaText = PLANTILLAS[plantilla] || PLANTILLAS.libre;

  return `Eres un redactor académico universitario chileno experto. Genera el contenido completo de un trabajo llamado: "${titulo}".

TIPO DE DOCUMENTO: ${tipo === 'pdf' ? 'PDF / Documento' : 'Word (.docx)'}

PLANTILLA BASE:
${plantillaText}

${requirements ? `ANÁLISIS DE LAS INSTRUCCIONES DEL PROFESOR:
${JSON.stringify(requirements, null, 2)}` : ''}

${instrucciones ? `INSTRUCCIONES ADICIONALES DEL ALUMNO:
${instrucciones}` : ''}

FORMATO DE SALIDA (markdown):
- ## para secciones principales
- ### para subsecciones
- Listas con - para bullets
- **negrita** para énfasis
- Tablas con | cuando sea apropiado
- Lenguaje académico formal en español chileno
- Sin emojis
- Sin preámbulos ("¡Claro!", "Con gusto", etc.)
- Comienza directamente con el contenido del trabajo

Genera el trabajo completo ahora:`;
}

function buildPresentacionPrompt(titulo, plantilla, requirements, instrucciones) {
  return `Eres un diseñador de presentaciones académicas universitarias chilenas. Genera una presentación completa para: "${titulo}".

PLANTILLA:
${PLANTILLAS.presentacion}

${requirements ? `ANÁLISIS DE LAS INSTRUCCIONES DEL PROFESOR:
${JSON.stringify(requirements, null, 2)}` : ''}

${instrucciones ? `INSTRUCCIONES ADICIONALES:
${instrucciones}` : ''}

REGLAS:
- Entre 8 y 15 slides
- Máximo 5 bullets por slide de contenido
- Lenguaje conciso y académico
- Bullets completos pero breves (no fragmentos)

Responde ÚNICAMENTE con JSON válido (sin texto adicional, sin bloques de código):
{
  "slides": [
    { "type": "portada", "title": "...", "subtitle": "...", "details": "..." },
    { "type": "agenda", "title": "Agenda", "bullets": ["...", "..."] },
    { "type": "contenido", "title": "...", "bullets": ["...", "..."] },
    { "type": "conclusion", "title": "Conclusiones", "bullets": ["...", "..."] },
    { "type": "cierre", "title": "¿Preguntas?", "subtitle": "..." }
  ]
}`;
}

async function fetchToBase64(url) {
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const buf  = await resp.arrayBuffer();
  const ct   = resp.headers.get('content-type') || 'application/pdf';
  return { base64: Buffer.from(buf).toString('base64'), mediaType: ct };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    titulo              = 'Trabajo',
    tipo                = 'pdf',
    plantilla           = 'libre',
    instruccionesTexto  = '',
    instruccionesArchivo = null,
    materialRamo        = [],
  } = req.body ?? {};

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey    = process.env.GEMINI_API_KEY;

  if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada' });
  if (!geminiKey)    return res.status(500).json({ error: 'GEMINI_API_KEY no configurada' });

  // ── Step 1: Resolve files ─────────────────────────────────────────────────
  const allFiles = [...materialRamo];
  if (instruccionesArchivo) allFiles.unshift(instruccionesArchivo);

  const resolvedFiles = await Promise.all(
    allFiles.map(async (f) => {
      if (f?.base64) return f;
      if (f?.storageUrl) {
        const data = await fetchToBase64(f.storageUrl).catch(() => null);
        return data ? { title: f.title, ...data } : null;
      }
      return null;
    })
  );
  const validFiles = resolvedFiles.filter(Boolean);

  // ── Step 2: Gemini Flash analyzes the instruction file (first file) ───────
  let requirements = null;
  if (validFiles.length > 0) {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Analyze instruction file (most important) — plus content key info from material
    const targetFile = validFiles[0];
    try {
      const result = await model.generateContent([
        { inlineData: { mimeType: targetFile.mediaType || 'application/pdf', data: targetFile.base64 } },
        GEMINI_REQUIREMENTS_PROMPT,
      ]);
      const raw  = result.response.text().trim();
      const json = raw.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1]?.trim() ?? raw;
      requirements = JSON.parse(json);
    } catch (err) {
      console.warn('[trabajos-generate] Gemini analysis failed:', err.message);
    }
  }

  // ── Step 3: Build Claude system + user prompt ─────────────────────────────
  const client     = new Anthropic({ apiKey: anthropicKey });
  const isPptx     = tipo === 'pptx';
  const userPrompt = isPptx
    ? buildPresentacionPrompt(titulo, plantilla, requirements, instruccionesTexto)
    : buildDocumentPrompt(titulo, tipo, plantilla, requirements, instruccionesTexto);

  const systemPrompt = isPptx
    ? 'Eres un diseñador de presentaciones académicas universitarias. Respondes ÚNICAMENTE con JSON válido.'
    : 'Eres un redactor académico universitario chileno. Redactas trabajos completos, formales y bien estructurados.';

  // ── Step 4: Stream Claude via SSE ─────────────────────────────────────────
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = client.messages.stream({
      model:      'claude-sonnet-4-6',
      max_tokens: 8000,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ chunk: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true, tipo })}\n\n`);
    res.end();
  } catch (err) {
    console.error('[trabajos-generate] Claude error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message || 'Error al generar trabajo' });
    }
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}
