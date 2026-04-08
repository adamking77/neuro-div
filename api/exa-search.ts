import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "EXA_API_KEY not configured" });
  }

  const { query, category } = req.body as { query: string; phase: number; category?: string };

  const body: Record<string, unknown> = {
    query,
    numResults: 10,
    type: "neural",
    contents: { highlights: { numSentences: 1, highlightsPerUrl: 2 } },
  };

  if (category) body.category = category;

  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    return res.status(response.status).json({ error: `Exa API error ${response.status}: ${text}` });
  }

  const data = await response.json() as { results: unknown[] };
  return res.json(data.results);
}
