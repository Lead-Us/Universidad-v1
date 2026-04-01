export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY no configurada' });
  }

  const { messages, sources } = req.body;

  const sourcesText = (sources ?? [])
    .filter(s => s.content?.trim())
    .map((s, i) => `[Fuente ${i + 1}: ${s.title || 'Sin título'}]\n${s.content.trim()}`)
    .join('\n\n---\n\n');

  const systemPrompt = sourcesText
    ? `Eres un asistente de estudio. Responde basándote PRINCIPALMENTE en las fuentes proporcionadas por el usuario. Cuando la respuesta esté en las fuentes, cita de dónde viene. Si no está en las fuentes, indícalo claramente pero igualmente ayuda con tu conocimiento.

FUENTES DEL USUARIO:
${sourcesText}`
    : 'Eres un asistente de estudio universitario. Ayuda al estudiante con sus preguntas de manera clara y concisa.';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(messages ?? []),
        ],
        temperature: 0.4,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message ?? 'Groq API error' });
    }

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content ?? '',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
