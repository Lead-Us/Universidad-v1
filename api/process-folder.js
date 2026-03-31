export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY no configurada en Vercel' });
  }

  const { structure, textContents } = req.body;

  const structureText = Object.entries(structure || {})
    .map(([ramo, files]) => `📁 ${ramo}/\n${files.map(f => `   - ${f}`).join('\n')}`)
    .join('\n\n');

  // Separate __programa__ entries (syllabus text) from other text files
  const programaEntries = Object.entries(textContents || {}).filter(([k]) => k.includes('/__programa__'));
  const otherEntries    = Object.entries(textContents || {}).filter(([k]) => !k.includes('/__programa__'));

  const programaSection = programaEntries.length > 0
    ? '\n\n## ⭐ PROGRAMAS OFICIALES DE RAMOS (FUENTE PRIORITARIA):\n' +
      'Usa estos textos como fuente PRINCIPAL para extraer: profesor (busca "Docente:", "Profesor:", "Prof."), código, sección, créditos, ponderaciones exactas (busca "%" en tablas de evaluación), has_attendance (busca "asistencia obligatoria" o "% mínimo de asistencia").\n' +
      programaEntries
        .map(([path, content]) => {
          const ramo = path.split('/__programa__')[0].split('/').pop();
          return `\n### Programa oficial de "${ramo}":\n${String(content).slice(0, 6000)}`;
        })
        .join('\n')
    : '';

  const textsSection = otherEntries.length > 0
    ? '\n\n## Contenido de otros archivos de texto:\n' +
      otherEntries
        .map(([path, content]) => `\n### ${path}:\n${String(content).slice(0, 2000)}`)
        .join('\n')
    : '';

  const systemPrompt = `Eres un asistente que analiza la estructura de archivos de un estudiante universitario y genera datos estructurados para una app de gestión académica. Responde ÚNICAMENTE con un JSON válido, sin texto adicional ni bloques de código markdown.`;

  const userPrompt = `Analiza cuidadosamente la estructura de carpetas de un estudiante universitario chileno. Cada carpeta de primer nivel es un ramo (asignatura universitaria).

INSTRUCCIONES DE EXTRACCIÓN:
1. **Nombre y código del ramo**: El nombre de la carpeta ES el nombre del ramo. El código suele aparecer en los nombres de archivo (ej: "Syllabus ECO355.pdf" → código ECO355, "FIN302 programa.pdf" → FIN302).
2. **Profesor**: Busca en nombres de archivo que contengan "Syllabus", "Programa", "programa del curso", "prof", "docente". El nombre del profesor suele aparecer después del código o nombre del ramo.
3. **Evaluaciones**: Busca archivos con "Control", "Prueba", "Examen", "Certamen", "Tarea", "Quiz", "Test". Crea módulos de evaluación con pesos que sumen exactamente 100%. Infiere las fechas si aparecen números (ej: "Prueba 1", "Prueba 2" → dos ítems en el módulo Pruebas).
4. **Unidades y materias**: Busca archivos con "Unidad", "Clase", "Cap", "Tema", "Semana". Agrupa archivos relacionados en la misma unidad.
5. **Horario**: Si hay archivos de horario, extrae días y horas. Usa formato HH:MM para start_time y end_time.
6. **Archivos**: Lista TODOS los archivos del ramo en el campo "files".
7. **Color**: Asigna un color hex vibrante y único a cada ramo.
8. **has_attendance**: true si el ramo tiene "asistencia" en algún archivo o si es un laboratorio/taller.

## Estructura de carpetas:
${structureText}${programaSection}${textsSection}

Responde con exactamente este JSON (sin texto adicional, sin bloques de código):
{
  "ramos": [
    {
      "name": "Nombre del Ramo",
      "code": "COD123",
      "professor": "Nombre Apellido",
      "section": "Sección X",
      "credits": 5,
      "color": "#3B82F6",
      "has_attendance": false,
      "files": ["archivo1.pdf", "archivo2.pdf"],
      "evaluationModules": [
        {
          "name": "Controles",
          "weight": 30,
          "items": [{ "name": "Control 1", "grade": null, "date": null }]
        }
      ],
      "units": [
        {
          "name": "Unidad 1: Nombre",
          "order": 1,
          "materias": [{ "name": "Tema", "description": "Descripción breve", "files": ["archivo.pdf"] }]
        }
      ],
      "schedule": [
        { "day_of_week": 0, "start_time": "08:30", "end_time": "09:40", "sala": "" }
      ]
    }
  ]
}`;

  // Try models in order — llama-3.3-70b is best for structured JSON, fallback to smaller ones
  const models = [
    'llama-3.3-70b-versatile',
    'llama3-70b-8192',
    'llama3-8b-8192',
    'mixtral-8x7b-32768',
  ];

  const errors = [];
  for (const model of models) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: 8192,
          response_format: { type: 'json_object' },
        }),
      });

      if (response.status === 429 || response.status === 503) {
        errors.push(`${model}: límite de tasa (${response.status})`);
        continue;
      }
      if (response.status === 400) {
        // Some models don't support response_format — retry without it
        const retry = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user',   content: userPrompt },
            ],
            temperature: 0.2,
            max_tokens: 8192,
          }),
        });
        if (!retry.ok) {
          errors.push(`${model}: HTTP ${retry.status}`);
          continue;
        }
        const retryResult = await retry.json();
        const retryText = retryResult.choices?.[0]?.message?.content?.trim();
        if (!retryText) { errors.push(`${model}: sin contenido`); continue; }
        const m = retryText.match(/```(?:json)?\s*([\s\S]*?)```/) || retryText.match(/(\{[\s\S]*\})/);
        const parsed = JSON.parse(m ? m[1] : retryText);
        return res.status(200).json(parsed);
      }
      if (!response.ok) {
        const errText = await response.text();
        errors.push(`${model}: HTTP ${response.status}`);
        continue;
      }

      const result = await response.json();
      const text = result.choices?.[0]?.message?.content?.trim();
      if (!text) { errors.push(`${model}: sin contenido`); continue; }

      const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
      const parsed = JSON.parse(m ? m[1] : text);
      return res.status(200).json(parsed);
    } catch (err) {
      errors.push(`${model}: ${err.message}`);
    }
  }

  return res.status(500).json({
    error: `No se pudo procesar con Groq. Errores: ${errors.join(' | ')}`,
  });
}
