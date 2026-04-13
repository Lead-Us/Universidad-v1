// POST /api/notebook-chat
// Body: { sources, messages, learningContext? }
// Returns: { reply }
// Uses Anthropic claude-sonnet-4-6 via ANTHROPIC_API_KEY

import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages = [], sources = [], learningContext = null } = req.body ?? {};

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada' });
  }

  const sourcesText = sources
    .filter(s => s.content?.trim())
    .map((s, i) => `[Fuente ${i + 1}: ${s.title || 'Sin título'}]\n${s.content.trim()}`)
    .join('\n\n---\n\n');

  const systemPrompt = [
    learningContext
      ? `Instrucción de método de estudio:\n${learningContext}`
      : 'Eres un tutor académico inteligente. Ayuda al estudiante a aprender y entender el material proporcionado.',
    sourcesText
      ? `\n\nMaterial de estudio disponible:\n\n${sourcesText}`
      : '',
    '\n\nResponde en español. Sé claro, estructurado y pedagógico. Cuando cites información de las fuentes, indica de cuál proviene.',
  ].join('').trim();

  const anthropicMessages = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }));

  if (anthropicMessages.length === 0 || anthropicMessages.at(-1).role !== 'user') {
    anthropicMessages.push({
      role: 'user',
      content: 'Genera una explicación o resumen del material de estudio.',
    });
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 2048,
      system:     systemPrompt,
      messages:   anthropicMessages,
    });

    const reply = response.content?.[0]?.text ?? '';
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('[notebook-chat] Anthropic error:', err);
    return res.status(500).json({ error: err.message || 'Error al generar respuesta' });
  }
}
