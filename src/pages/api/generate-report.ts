import type { APIRoute } from "astro";
import { buildDeterministicAnalysisReport } from "../../lib/analysis-reports";
import { parseGenerateReportInput } from "../../lib/server/analysis-contract";
import { generateReportWithDeepSeek } from "../../lib/server/deepseek";

export const POST: APIRoute = async ({ request }) => {
  const input = parseGenerateReportInput(await request.json());

  try {
    const report = await generateReportWithDeepSeek(input);
    return Response.json({ source: "deepseek", report });
  } catch (error) {
    const report = buildDeterministicAnalysisReport(input);
    return Response.json({
      source: "deterministic",
      report,
      error: error instanceof Error ? error.message : "Unknown model error.",
    });
  }
};
