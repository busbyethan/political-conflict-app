import { chat } from '../lib/ai.js';

const ANALYZE_PROMPT = `You are analyzing open-ended written responses from a political conflict self-assessment.
The person has written: an initial reflection on what they find hard about political disagreement, a story about a difficult political conversation, and thoughts on how their views have changed.
Based only on what they actually wrote — their word choices, what they emphasized, what they avoided — provide exactly 4 bullet-point insights in second person ("You...").
Each insight is 1-2 sentences. Cover: (1) the most prominent emotional pattern in how they talk about political conflict, (2) a specific strength visible in their writing, (3) one specific habit or pattern worth developing, (4) one precise observation that could only apply to this person based on their actual words.
Avoid generic observations. Be concrete and specific. Do not moralize.
Format as exactly 4 lines, each starting with "• ".`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { responses } = req.body;
  if (!responses || responses.trim().length < 10) return res.status(400).json({ error: 'No responses to analyze' });

  try {
    const text = await chat(ANALYZE_PROMPT, responses.trim(), 500);
    res.json({ text });
  } catch (err) {
    console.error('Analyze error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
