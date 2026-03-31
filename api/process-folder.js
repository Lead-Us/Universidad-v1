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

  const textsSection = textContents && Object.keys(textContents).length > 0
    ? '\n\n## Contenido de archivos de texto:\n' +
      Object.entries(textContents)
        .map(([path, content]) => `\n### ${path}:\n${String(content).slice(0, 2000)}`)
        .join('\n')
    : '';

  const systemPrompt = `Eres un asistente que analiza la estructura de archivos de un estudiante universitario y genera datos estructurados para una app de gestión académica. Responde ÚNICAMENTE con un JSON válido, sin texto adicional ni bloques de código markdown.`;

  const userPrompt = `Analiza la estructura de carpetas de un estudiante universitario. Cada carpeta de primer nivel es un ramo (asignatura). Infiere a partir de los nombres de archivos:
- Nombre del ramo (de la carpeta)
- Código del ramo (si aparece en filenames, ej: "ECO355", "FIN302")
- Nombre del profesor (si aparece en filenames)
- Sección, créditos (si aparecen)
- Color sugerido (hex, colores distintos y bonitos para cada ramo)
- Unidades: infiere de archivos que digan "Unidad 1", "Unidad 2", "Tema 1", "Cap 1", etc.
- Materias dentro de cada unidad: subtemas inferidos de los nombres de archivo
- Módulos de evaluación: infiere de archivos con "Control", "Prueba", "Examen", "Tarea" — pesos deben sumar 100%
- Horario: si hay archivos de horario, extrae días y horas (day_of_week: 0=Lun…4=Vie)
- has_attendance: true si el ramo parece tener asistencia obligatoria

## Estructura de carpetas:
${structureText}${textsSection}

Responde con exactamente este JSON (sin texto adicional):
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
      "files": ["archivo1.pdf"],
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
