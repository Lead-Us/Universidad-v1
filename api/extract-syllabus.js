// POST /api/extract-syllabus
// Body: { type: 'pdf', base64: string, filename: string }
//    or { type: 'text', content: string, filename: string }
// Returns: { name, code, professor, section, credits, has_attendance, blocks }
// Uses Anthropic claude-haiku-4-5 with native PDF document support

import Anthropic from '@anthropic-ai/sdk';

const EXTRACTION_PROMPT = `Extrae la siguiente información del programa/syllabus universitario chileno y responde ÚNICAMENTE con este JSON (sin texto adicional, sin bloques de código):

{
  "name": "Nombre completo del ramo/asignatura",
  "code": "Código del curso (ej: MAT1101, ECO355) o null",
  "professor": "Nombre completo del docente/profesor o null",
  "section": "Número o nombre de sección (ej: '3' o 'Sección 3') o null",
  "credits": número_entero_o_null,
  "has_attendance": true_o_false,
  "blocks": [
    { "day": "Lunes|Martes|Miércoles|Jueves|Viernes|Sábado", "start_time": "HH:MM", "end_time": "HH:MM", "sala": "" }
  ]
}

Reglas de extracción:
- "name": nombre completo del ramo tal como aparece en el documento
- "code": código alfanumérico, ej: ECO355, FIN302, ADM201, MAT1101. Busca en el encabezado del documento.
- "professor": busca "Docente:", "Profesor/a:", "Prof.", "Encargado:", "Instructor:". Extrae solo el nombre (no el email). Si aparece email, extrae el nombre antes del email.
- "section": busca "Sección", "Section", "Paralelo". Devuelve solo el número/letra, ej: "3" o "A".
- "credits": busca "créditos", "SCT", "unidades". Devuelve entero. Si dice "5 SCT" → 5.
- "has_attendance": true SOLO si menciona explícitamente asistencia mínima obligatoria (ej: "75% asistencia mínima", "asistencia obligatoria") — false si no menciona nada.
- "blocks": SOLO si hay días + horarios explícitos (ej: "Lunes 08:30-09:40 Sala B201"). Si no hay horarios, devuelve [].
- Si un campo no se encuentra, usa null (o [] para blocks).
- Responde SOLO el JSON.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, base64, content, filename = 'programa' } = req.body ?? {};

  if (!type || (type === 'pdf' && !base64) || (type === 'text' && !content)) {
    return res.status(400).json({ error: 'Se requiere { type: "pdf", base64 } o { type: "text", content }' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada' });
  }

  const client = new Anthropic({ apiKey });

  // Build message content depending on file type
  let messageContent;

  if (type === 'pdf') {
    // Native PDF support — Claude reads the file directly (no lossy text extraction)
    messageContent = [
      {
        type: 'document',
        source: {
          type:       'base64',
          media_type: 'application/pdf',
          data:       base64,
        },
        title: filename,
      },
      {
        type: 'text',
        text: EXTRACTION_PROMPT,
      },
    ];
  } else {
    // Text content (from DOCX or PPT extraction)
    messageContent = [
      {
        type: 'text',
        text: `${EXTRACTION_PROMPT}\n\n---\n\nCONTENIDO DEL DOCUMENTO (${filename}):\n\n${String(content).slice(0, 12000)}`,
      },
    ];
  }

  try {
    const response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system:     'Eres un asistente experto en leer programas de cursos universitarios chilenos y extraer información estructurada. Respondes ÚNICAMENTE con JSON válido.',
      messages:   [{ role: 'user', content: messageContent }],
      temperature: 0,
    });

    const rawText = response.content?.[0]?.text?.trim() ?? '';

    // Strip markdown code fences if model added them
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) ?? rawText.match(/(\{[\s\S]*\})/);
    const jsonStr   = jsonMatch ? jsonMatch[1].trim() : rawText;

    const parsed = JSON.parse(jsonStr);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error('[extract-syllabus] error:', err);
    return res.status(500).json({ error: err.message || 'Error al procesar el documento' });
  }
}
