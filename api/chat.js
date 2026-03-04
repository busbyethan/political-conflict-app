import { chat } from '../lib/ai.js';

const CONV_PROMPTS = {
  conv1: `You are a thoughtful researcher studying how people experience political conflict.
Someone has described a difficult political conversation they had. Read their account carefully and respond with:
(1) 1-2 sentences of genuine, non-judgmental acknowledgment that reflects the specific difficulty they described.
(2) Exactly one focused follow-up question inviting them to reflect on their internal experience — what they felt, wanted, or feared in that moment.
Keep your total response under 90 words. Do not give advice. Do not evaluate their behavior. Do not moralize.`,

  conv2: `You are a thoughtful researcher studying political persuasion and belief change.
Someone has reflected on how their political views have shifted (or stayed stable) over time.
Read their response carefully and respond with:
(1) 1-2 sentences acknowledging what they shared with genuine curiosity.
(2) Exactly one follow-up question exploring the social or emotional dimension of that experience — who influenced them, or what it felt like.
Keep your total response under 90 words. Do not evaluate or moralize.`,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { questionId, userText } = req.body;
  const systemPrompt = CONV_PROMPTS[questionId];
  if (!systemPrompt) return res.status(400).json({ error: 'Unknown question ID' });
  if (!userText || userText.trim().length < 5) return res.status(400).json({ error: 'Text too short' });

  try {
    const text = await chat(systemPrompt, userText.trim(), 300);
    res.json({ text });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
