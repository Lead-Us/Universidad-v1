// POST /api/aprender-chat
// Body: { sources, methodPrompt, messages }
// Returns: { reply }
// Uses Anthropic claude-sonnet-4-6 via ANTHROPIC_API_KEY_APRENDER

import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sources = [], methodPrompt = '', messages = [] } = req.body ?? {};

  const apiKey = process.env.ANTHROPIC_API_KEY_APRENDER || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY_APRENDER not configured' });
  }

  const client = new Anthropic({ apiKey });

  // Build system prompt from sources + method
  const sourcesText = sources
    .filter(s => s.content)
    .map((s, i) => `[Fuente ${i + 1}: ${s.title}]\n${s.content}`)
    .join('\n\n---\n\n');

  const systemPrompt = [
    methodPrompt
      ? `Instrucción de método de estudio:\n${methodPrompt}`
      : 'Eres un tutor académico inteligente. Ayuda al estudiante a aprender y entender el material proporcionado.',
    sourcesText
      ? `\n\nMaterial de estudio disponible:\n\n${sourcesText}`
      : '',
    '\n\nResponde en español. Sé claro, estructurado y pedagógico. Si el estudiante no especifica una tarea, genera un resumen o explicación del material usando el método indicado.',
  ].join('').trim();

  // Convert messages to Anthropic format (filter out any system messages)
  const anthropicMessages = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }));

  // Ensure the last message is from the user
  if (anthropicMessages.length === 0 || anthropicMessages[anthropicMessages.length - 1].role !== 'user') {
    anthropicMessages.push({
      role: 'user',
      content: 'Genera el material de estudio basado en las fuentes y el método seleccionado.',
    });
  }

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
    console.error('Anthropic API error:', err);
    return res.status(500).json({ error: err.message || 'Error al generar respuesta' });
  }
}
