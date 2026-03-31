export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en Vercel' });
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

  const prompt = `Eres un asistente que analiza la estructura de archivos de un estudiante universitario y genera datos estructurados para una app de gestión académica.

## Estructura de carpetas del estudiante:
${structureText}${textsSection}

## Instrucciones:
Analiza los nombres de las carpetas y archivos. Cada carpeta de primer nivel es un ramo (asignatura). Infiere a partir de los nombres de archivos:
- Nombre del ramo (de la carpeta)
- Código del ramo (si aparece en filenames, ej: "ECO355", "FIN302")
- Nombre del profesor (si aparece en filenames, ej: "Syllabus ECO355 Carlos Briceño.pdf")
- Sección (si aparece)
- Créditos (si aparece)
- Color sugerido (hex, elige colores distintos y bonitos para cada ramo)
- Unidades: infiere de archivos que digan "Unidad 1", "Unidad 2", "Tema 1", "Cap 1", etc.
- Materias dentro de cada unidad: subtemas inferidos de los nombres de archivo
- Módulos de evaluación: infiere de archivos que digan "Control", "Prueba", "Examen", "Tarea", con sus pesos estimados (deben sumar 100%)
- Horario: si hay archivos de horario, intenta extraer días y horas (day_of_week: 0=Lun,1=Mar,2=Mié,3=Jue,4=Vie)
- has_attendance: true si el ramo parece tener asistencia obligatoria

Responde ÚNICAMENTE con un JSON válido, sin texto adicional ni bloques de código, con esta estructura exacta:

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
          "items": [
            { "name": "Control 1", "grade": null, "date": null }
          ]
        }
      ],
      "units": [
        {
          "name": "Unidad 1: Nombre",
          "order": 1,
          "materias": [
            { "name": "Tema", "description": "Descripción breve", "files": ["archivo.pdf"] }
          ]
        }
      ],
      "schedule": [
        { "day_of_week": 0, "start_time": "08:30", "end_time": "09:40", "sala": "" }
      ]
    }
  ]
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: `Gemini API error: ${err}` });
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error('Gemini no devolvió contenido');

    // Strip markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;
    const parsed = JSON.parse(jsonText);

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
