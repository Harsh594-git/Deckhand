export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { notes, count } = req.body || {};
  if (!notes || typeof notes !== 'string' || !notes.trim()) {
    return res.status(400).json({ error: 'Missing notes' });
  }

  let n = parseInt(count, 10);
  if (isNaN(n) || n < 4) n = 4;
  if (n > 12) n = 12;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set on the server' });
  }

  const system =
    'You write flashcards for a study app. Given study material, produce exactly ' + n +
    ' flashcards as a JSON array only — no preamble, no markdown fences. Each item: ' +
    '{"q": "question or prompt", "a": "concise answer, 1-2 sentences"}. Cover distinct facts ' +
    'or concepts, avoid duplicates, keep questions specific and answers precise. Also include ' +
    'one extra field "topic" only on the FIRST array item, a 2-4 word label for the whole deck ' +
    '(still valid JSON, just an extra key on that one object).';

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1500,
        system: system,
        messages: [{ role: 'user', content: notes }]
      })
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      return res.status(502).json({ error: 'Upstream error', detail });
    }

    const data = await upstream.json();
    const textBlock = (data.content || []).find((b) => b.type === 'text');
    if (!textBlock) {
      return res.status(502).json({ error: 'No text in model response' });
    }

    let t = textBlock.text.trim();
    t = t.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
    const start = t.indexOf('[');
    const end = t.lastIndexOf(']');
    if (start === -1 || end === -1) {
      return res.status(502).json({ error: 'No JSON array found in model response' });
    }

    const cards = JSON.parse(t.slice(start, end + 1));
    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(502).json({ error: 'Model returned an empty deck' });
    }

    return res.status(200).json({ cards });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: String(err) });
  }
}
