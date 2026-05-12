// POST /api/process-folder
// Body: { structure, textContents }
// Returns: { ramos: [...] }
// Uses Anthropic claude-sonnet-4-6 for accurate structured extraction

import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada en Vercel' });
  }

  const { structure, textContents } = req.body;

  const structureText = Object.entries(structure || {})
    .map(([ramo, files]) => `📁 ${ramo}/\n${files.map(f => `   - ${f}`).join('\n')}`)
    .join('\n\n');

  // Separate __programa__ entries (syllabus text) from other text files
  const programaEntries = Object.entries(textContents || {}).filter(([k]) => k.includes('/__programa__'));
  const otherEntries    = Object.entries(textContents || {}).filter(([k]) => !k.includes('/__programa__'));

  const programaSection = programaEntries.length > 0
    ? '\n\n## ⭐ PROGRAMAS OFICIALES DE RAMOS (FUENTE PRIORITARIA — LEE COMPLETO):\n' +
      'Este es el documento oficial del ramo (programa, syllabus, "letras" o guía del curso). DEBES extraer de aquí:\n' +
      '- profesor/docente: busca "Docente:", "Profesor:", "Prof.", "Instructor:", nombre antes de "@" en correos\n' +
      '- código del ramo: busca código alfanumérico de 3-8 caracteres (ej: ECO355, FIN302, ADM201)\n' +
      '- sección: busca "Sección", "Section", número después del código\n' +
      '- créditos: busca "créditos", "SCT", "unidades"\n' +
      '- evaluaciones y ponderaciones: busca tablas con "%" — RESPETA los porcentajes exactos del documento\n' +
      '- asistencia: has_attendance=true si menciona "% mínimo de asistencia", "asistencia obligatoria"\n' +
      '- unidades/contenidos: busca "Unidad", "Módulo", "Semana", "Contenidos"\n' +
      '- horario: busca días (Lunes, Martes…) con horas\n\n' +
      programaEntries
        .map(([path, content]) => {
          const ramo = path.split('/__programa__')[0].split('/').pop();
          return `\n### Programa oficial de "${ramo}":\n${String(content).slice(0, 6000)}`;
        })
        .join('\n')
    : '\n\n⚠️ No se encontró programa oficial. Infiere lo que puedas de los nombres de archivos.';

  const textsSection = otherEntries.length > 0
    ? '\n\n## Contenido de otros archivos de texto:\n' +
      otherEntries
        .map(([path, content]) => `\n### ${path}:\n${String(content).slice(0, 2000)}`)
        .join('\n')
    : '';

  const systemPrompt = `Eres un asistente experto que analiza la estructura de archivos de un estudiante universitario chileno y genera datos estructurados para una app de gestión académica.
Responde ÚNICAMENTE con un JSON válido, sin texto adicional ni bloques de código markdown.`;

  const userPrompt = `Analiza cuidadosamente la estructura de carpetas de un estudiante universitario chileno. Cada carpeta de primer nivel es un ramo (asignatura universitaria).

INSTRUCCIONES DE EXTRACCIÓN:
1. **Nombre y código del ramo**: El nombre de la carpeta ES el nombre del ramo. El código suele aparecer en los nombres de archivo (ej: "Syllabus ECO355.pdf" → código ECO355, "FIN302 programa.pdf" → FIN302).
2. **Profesor**: Extrae del programa oficial si está disponible. Busca patrones: "Docente:", "Profesor:", "Prof.", nombre antes de "@" en correos, nombre en la primera página del documento. Si no hay programa, infiere del nombre de archivo.
3. **Evaluaciones**: Busca archivos con "Control", "Prueba", "Examen", "Certamen", "Tarea", "Quiz", "Test". Crea módulos de evaluación con pesos que sumen exactamente 100%. Infiere las fechas si aparecen números (ej: "Prueba 1", "Prueba 2" → dos ítems en el módulo Pruebas).
4. **Unidades y materias**: Busca archivos con "Unidad", "Clase", "Cap", "Tema", "Semana". Agrupa archivos relacionados en la misma unidad.
5. **Horario**: Si hay archivos de horario, extrae días y horas. Usa formato HH:MM para start_time y end_time.
6. **Archivos**: Lista TODOS los archivos del ramo en el campo "files". También clasifícalos en "classified_files" según su tipo:
   - "evaluaciones_pasadas": exámenes/controles pasados, soluciones, pauta, certamen, prueba (archivos de evaluaciones PASADAS, no material de estudio)
   - "ejercicios": ejercicios, problemas, guías de práctica, talleres, homework
   - "ppt": presentaciones, slides, diapositivas (.pptx/.ppt o archivos con "slide", "ppt", "clase", "presentacion")
   - El programa del ramo va en "programa_file" (solo el nombre del archivo)
   - Archivos que no encajan en ninguna categoría se dejan sin clasificar (van a "todos" por defecto)
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
      "programa_file": "Syllabus ECO355.pdf",
      "classified_files": {
        "evaluaciones_pasadas": ["Control1_sol.pdf"],
        "ejercicios": ["guia1.pdf"],
        "ppt": ["clase1.pptx"]
      },
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

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 8192,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
      temperature: 0.1,
    });

    const rawText = response.content?.[0]?.text?.trim() ?? '';
    if (!rawText) throw new Error('La IA no devolvió contenido');

    // Strip markdown code fences if model added them
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) ?? rawText.match(/(\{[\s\S]*\})/);
    const jsonStr   = jsonMatch ? jsonMatch[1].trim() : rawText;

    const parsed = JSON.parse(jsonStr);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error('[process-folder] Anthropic error:', err);
    return res.status(500).json({
      error: `Error al procesar con IA: ${err.message}`,
    });
  }
}
