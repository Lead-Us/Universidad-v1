// POST /api/aprender-chat
// Body: { sources, methodKey, messages }
// Returns: { reply }
// Uses Anthropic claude-sonnet-4-6 via ANTHROPIC_API_KEY_APRENDER

import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from './prompts.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sources = [], methodKey = '', messages = [] } = req.body ?? {};

  const apiKey = process.env.ANTHROPIC_API_KEY_APRENDER || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY_APRENDER not configured' });
  }

  const client = new Anthropic({ apiKey });

  // Build pedagogical system prompt from .md files
  const systemBase = buildSystemPrompt(methodKey);

  // Append student material as context
  const sourcesText = sources
    .filter(s => s.content)
    .map((s, i) => `[Fuente ${i + 1}: ${s.title}]\n${s.content}`)
    .join('\n\n---\n\n');

  const systemPrompt = sourcesText
    ? `${systemBase}\n\n---\n\nMaterial de estudio disponible:\n\n${sourcesText}`
    : systemBase;

  // Convert messages to Anthropic format (filter out system messages)
  const anthropicMessages = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }));

  // Ensure conversation ends with a user message
  if (anthropicMessages.length === 0 || anthropicMessages[anthropicMessages.length - 1].role !== 'user') {
    anthropicMessages.push({
      role: 'user',
      content: 'Genera el material de estudio basado en las fuentes y el método seleccionado.',
    });
  }

  try {
    const response = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 5000,
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
