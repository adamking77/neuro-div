import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "EXA_API_KEY not configured" });
  }

  const { url } = req.body as { url: string };

  const response = await fetch("https://api.exa.ai/contents", {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ ids: [url], text: { maxCharacters: 3000 } }),
  });

  if (!response.ok) {
    const text = await response.text();
    return res.status(response.status).json({ error: `Exa crawl error ${response.status}: ${text}` });
  }

  const text = await response.text();
  return res.send(text);
}
