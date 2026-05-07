export async function POST(req: Request) {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "EXA_API_KEY not configured" }, { status: 500 });
  }

  const { url } = (await req.json()) as { url?: string };
  if (!url || !url.trim()) {
    return Response.json({ error: "url is required" }, { status: 400 });
  }

  const response = await fetch("https://api.exa.ai/contents", {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ ids: [url], text: { maxCharacters: 3000 } }),
  });

  if (!response.ok) {
    const text = await response.text();
    return Response.json({ error: `Exa crawl error ${response.status}: ${text}` }, { status: response.status });
  }

  const text = await response.text();
  return new Response(text, {
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}
