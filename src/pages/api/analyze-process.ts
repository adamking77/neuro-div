import type { APIRoute } from "astro";
import { buildDeterministicAnalysisReport } from "../../lib/analysis-reports";
import { processAnalysisRequestSchema } from "../../lib/server/analysis-contract";
import { analyzeProcessWithDeepSeek } from "../../lib/server/deepseek";

export const POST: APIRoute = async ({ request }) => {
  const input = processAnalysisRequestSchema.parse(await request.json());

  try {
    const analysis = await analyzeProcessWithDeepSeek(input);
    return Response.json({ source: "deepseek", analysis });
  } catch (error) {
    const fallbackReport = buildDeterministicAnalysisReport({
      profile: null,
      profileContext: input.profileContext,
      processInputs: input.processInputs,
      processPlan: input.processPlan,
    });

    return Response.json({
      source: "deterministic",
      analysis: {
        fitScore: fallbackReport.processFitScore,
        risks: fallbackReport.rescuePlan,
        recommendations: fallbackReport.recommendations,
        caveats: [
          "DeepSeek process analysis was unavailable, so this response uses deterministic process analysis.",
          error instanceof Error ? error.message : "Unknown model error.",
        ],
      },
    });
  }
};
