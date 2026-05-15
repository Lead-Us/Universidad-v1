// POST /api/process-sources
// Body: { sources: [{ title, storageUrl?, content? }] }
// Returns: { sources: [{ title, content }] }
// Processes files with Gemini and returns extracted text content.
// Retries each file up to 3 times before failing.

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_EXTRACT_PROMPT = `Extrae TODO el contenido de texto de este documento académico, preservando:
- Estructura de secciones y subsecciones
- Fórmulas matemáticas (usa notación LaTeX)
- Definiciones, teoremas y conceptos clave
- Ejemplos y ejercicios
- Tablas y datos

Responde con el contenido extraído de forma organizada. No resumas, extrae el texto completo.`;

const MAX_RETRIES = 4;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sources = [] } = req.body ?? {};
  const geminiKey = process.env.GEMINI_API_KEY;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!geminiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  if (sources.length === 0) {
    return res.status(400).json({ error: 'No sources provided' });
  }

  const genAI = new GoogleGenerativeAI(geminiKey);
  const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  const processed = [];
  const failed = [];

  for (const src of sources) {
    // If source already has text content, keep it
    if (src.content && !src.storageUrl) {
      processed.push({ title: src.title, content: src.content });
      continue;
    }

    if (!src.storageUrl) {
      failed.push({ title: src.title, error: 'No URL provided' });
      continue;
    }

    let extracted = false;
    for (let attempt = 0; attempt < MAX_RETRIES && !extracted; attempt++) {
      try {
        const fetchHeaders = {};
        if (supabaseKey && src.storageUrl.includes('supabase')) {
          fetchHeaders['Authorization'] = `Bearer ${supabaseKey}`;
          fetchHeaders['apikey'] = supabaseKey;
        }
        const resp = await fetch(src.storageUrl, { headers: fetchHeaders });
        if (!resp.ok) {
          if (attempt < MAX_RETRIES - 1) { await new Promise(r => setTimeout(r, (attempt + 1) * 5000)); continue; }
          failed.push({ title: src.title, error: `HTTP ${resp.status}` });
          continue;
        }

        const buf = await resp.arrayBuffer();
        const base64 = Buffer.from(buf).toString('base64');
        const ct = resp.headers.get('content-type') || 'application/pdf';

        const result = await geminiModel.generateContent([
          { inlineData: { mimeType: ct, data: base64 } },
          GEMINI_EXTRACT_PROMPT,
        ]);

        const extractedText = result.response.text().trim();
        if (extractedText && extractedText.length > 10) {
          processed.push({ title: src.title, content: extractedText });
          extracted = true;
        } else if (attempt < MAX_RETRIES - 1) {
          await new Promise(r => setTimeout(r, (attempt + 1) * 5000));
        }
      } catch (err) {
        const is429 = err.message && err.message.includes('429');
        const waitTime = is429 ? 20000 : (attempt + 1) * 5000;
        console.warn(`[process-sources] Attempt ${attempt + 1}/${MAX_RETRIES} failed for "${src.title}": ${err.message}${is429 ? ' (rate limit, waiting 20s)' : ''}`);
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(r => setTimeout(r, waitTime));
        }
      }
    }

    if (!extracted && !failed.find(f => f.title === src.title)) {
      // Use text content as fallback if available
      if (src.content) {
        processed.push({ title: src.title, content: src.content });
      } else {
        failed.push({ title: src.title, error: 'Could not extract content after retries' });
      }
    }
  }

  // Only succeed if ALL sources were processed
  if (failed.length > 0) {
    return res.status(422).json({
      error: 'Some sources could not be processed',
      failed,
      processed,
    });
  }

  return res.status(200).json({ sources: processed });
}
