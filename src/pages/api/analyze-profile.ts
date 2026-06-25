import type { APIRoute } from "astro";
import { profileSynthesisRequestSchema } from "../../lib/server/analysis-contract";
import { synthesizeProfileWithDeepSeek } from "../../lib/server/deepseek";

export const POST: APIRoute = async ({ request }) => {
  const input = profileSynthesisRequestSchema.parse(await request.json());

  try {
    const synthesis = await synthesizeProfileWithDeepSeek(input);
    return Response.json({ source: "deepseek", synthesis });
  } catch (error) {
    const context = input.profileContext;
    return Response.json({
      source: "deterministic",
      synthesis: {
        summary: context?.summary ?? "No saved ND profile context was available.",
        activationPatterns: context?.activationPatterns ?? [],
        shutdownRisks: context?.shutdownTriggers ?? [],
        missingContext: context ? [] : ["saved ND profile"],
        caveats: [
          "DeepSeek synthesis was unavailable, so this response uses deterministic profile context.",
          error instanceof Error ? error.message : "Unknown model error.",
        ],
      },
    });
  }
};
