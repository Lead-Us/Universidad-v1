import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, type MethodKey } from '../prompts/loader.js';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface SendMessageOptions {
  userMessage: string;
  methodKey: MethodKey;
  history?: Message[];
  sources?: { title: string; content: string }[];
}

/**
 * Sends a message to Claude using the pedagogical system prompt for methodKey.
 * Appends the student's source material as additional context in the system prompt.
 * Returns the assistant's reply text.
 */
export async function sendMessage({
  userMessage,
  methodKey,
  history = [],
  sources = [],
}: SendMessageOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY_APRENDER ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY_APRENDER is not set');

  const client = new Anthropic({ apiKey });

  const systemBase = buildSystemPrompt(methodKey);
  const sourcesText = sources
    .filter(s => s.content)
    .map((s, i) => `[Fuente ${i + 1}: ${s.title}]\n${s.content}`)
    .join('\n\n---\n\n');

  const system = sourcesText
    ? `${systemBase}\n\n---\n\nMaterial de estudio disponible:\n\n${sourcesText}`
    : systemBase;

  const messages: Anthropic.MessageParam[] = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 5000,
    system,
    messages,
  });

  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}
