import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Shared function used by both API routes.
// Automatically picks whichever API key you've set in your environment.
export async function chat(systemPrompt, userText, maxTokens = 350) {
  if (process.env.ANTHROPIC_API_KEY) {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userText }],
    });
    return response.content[0].text;
  }

  if (process.env.OPENAI_API_KEY) {
    const client = new OpenAI();
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userText },
      ],
    });
    return response.choices[0].message.content;
  }

  throw new Error('No API key configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.');
}
