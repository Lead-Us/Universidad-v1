import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { structure, textContents } = await req.json();
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY no configurada');

    // Build prompt from folder structure
    const structureText = Object.entries(structure as Record<string, string[]>)
      .map(([ramo, files]) => `📁 ${ramo}/\n${files.map(f => `   - ${f}`).join('\n')}`)
      .join('\n\n');

    const textsSection = textContents && Object.keys(textContents).length > 0
      ? '\n\n## Contenido de archivos de texto:\n' +
        Object.entries(textContents as Record<string, string>)
          .map(([path, content]) => `\n### ${path}:\n${content.slice(0, 2000)}`)
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

Responde ÚNICAMENTE con un JSON válido, sin texto adicional, con esta estructura exacta:

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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 8192,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error: ${err}`);
    }

    const result = await response.json();
    const text = result.content[0].text.trim();

    // Extract JSON from response (handle potential markdown code blocks)
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
    const jsonText = jsonMatch[1] || text;
    const parsed = JSON.parse(jsonText);

    return new Response(JSON.stringify(parsed), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
