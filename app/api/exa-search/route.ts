export async function POST(req: Request) {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "EXA_API_KEY not configured" }, { status: 500 });
  }

  const { query, category } = (await req.json()) as {
    query?: string;
    phase?: number;
    category?: string | null;
  };

  if (!query || !query.trim()) {
    return Response.json({ error: "query is required" }, { status: 400 });
  }

  const body: Record<string, unknown> = {
    query,
    numResults: 10,
    type: "neural",
    contents: { highlights: { numSentences: 3, highlightsPerUrl: 2 } },
  };

  if (category) {
    body.category = category;
  }

  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    return Response.json({ error: `Exa API error ${response.status}: ${text}` }, { status: response.status });
  }

  const data = (await response.json()) as { results: unknown[] };
  return Response.json(data.results);
}
