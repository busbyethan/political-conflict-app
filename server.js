import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ── Detect which AI provider to use ───────────────────────────────
const provider = process.env.ANTHROPIC_API_KEY ? 'anthropic'
               : process.env.OPENAI_API_KEY    ? 'openai'
               : null;

if (!provider) {
  console.error('ERROR: No API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in your .env file.');
  process.exit(1);
}

const anthropic = provider === 'anthropic' ? new Anthropic() : null;
const openai    = provider === 'openai'    ? new OpenAI()    : null;

console.log(`Using provider: ${provider}`);

// ── Unified chat function ──────────────────────────────────────────
async function chat(systemPrompt, userText, maxTokens = 350) {
  if (provider === 'anthropic') {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userText }],
    });
    return response.content[0].text;
  } else {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userText },
      ],
    });
    return response.choices[0].message.content;
  }
}

// ── System prompts (kept server-side so users never see them) ──────
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

const ANALYZE_PROMPT = `You are analyzing open-ended written responses from a political conflict self-assessment.
The person has written: an initial reflection on what they find hard about political disagreement, a story about a difficult political conversation, and thoughts on how their views have changed.
Based only on what they actually wrote — their word choices, what they emphasized, what they avoided — provide exactly 4 bullet-point insights in second person ("You...").
Each insight is 1-2 sentences. Cover: (1) the most prominent emotional pattern in how they talk about political conflict, (2) a specific strength visible in their writing, (3) one specific habit or pattern worth developing, (4) one precise observation that could only apply to this person based on their actual words.
Avoid generic observations. Be concrete and specific. Do not moralize.
Format as exactly 4 lines, each starting with "• ".`;

// ── Routes ─────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  try {
    const { questionId, userText } = req.body;
    const systemPrompt = CONV_PROMPTS[questionId];
    if (!systemPrompt) return res.status(400).json({ error: 'Unknown question ID' });
    if (!userText || userText.trim().length < 5) return res.status(400).json({ error: 'Text too short' });

    const text = await chat(systemPrompt, userText.trim(), 300);
    res.json({ text });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { responses } = req.body;
    if (!responses || responses.trim().length < 10) return res.status(400).json({ error: 'No responses to analyze' });

    const text = await chat(ANALYZE_PROMPT, responses.trim(), 500);
    res.json({ text });
  } catch (err) {
    console.error('Analyze error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`App running at http://localhost:${PORT}`));
