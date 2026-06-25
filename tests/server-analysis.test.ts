import { afterEach, describe, expect, it, vi } from "vitest";
import { buildDeterministicAnalysisReport } from "../src/lib/analysis-reports";
import { createEmptyProcessDesignerInputs, buildProcessPlan } from "../src/lib/process-designer";
import { generateReportWithDeepSeek } from "../src/lib/server/deepseek";
import { neuroDivAnalysisReportSchema } from "../src/lib/server/analysis-contract";
import { POST as generateReportRoute } from "../src/pages/api/generate-report";

function makeInput() {
  const processInputs = {
    ...createEmptyProcessDesignerInputs(),
    goal: "Ship the analysis report",
    successSignal: "A saved report opens from /reports.",
  };
  const processPlan = buildProcessPlan(processInputs, null);
  return {
    profile: null,
    profileContext: null,
    processInputs,
    processPlan,
  };
}

describe("server analysis contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.NEURODIV_MODEL;
  });

  it("rejects malformed report output", () => {
    expect(() => neuroDivAnalysisReportSchema.parse({ title: "Missing fields" })).toThrow();
  });

  it("assembles a DeepSeek chat request and parses a validated report", async () => {
    const input = makeInput();
    const report = {
      ...buildDeterministicAnalysisReport(input),
      model: {
        provider: "deepseek" as const,
        name: "deepseek-v4-flash",
      },
    };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify(report),
          },
        },
      ],
    }), { status: 200 }));

    process.env.DEEPSEEK_API_KEY = "test-key";
    process.env.NEURODIV_MODEL = "deepseek-v4-flash";
    vi.stubGlobal("fetch", fetchMock);

    const parsed = await generateReportWithDeepSeek(input);
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);

    expect(fetchMock).toHaveBeenCalledWith("https://api.deepseek.com/chat/completions", expect.objectContaining({
      method: "POST",
    }));
    expect(requestBody.model).toBe("deepseek-v4-flash");
    expect(requestBody.response_format).toEqual({ type: "json_object" });
    expect(parsed.model).toEqual({
      provider: "deepseek",
      name: "deepseek-v4-flash",
    });
    expect(parsed.processSnapshot.inputs.goal).toBe("Ship the analysis report");
  });

  it("injects server-owned report fields when DeepSeek omits snapshots", async () => {
    const input = makeInput();
    const {
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      profileSnapshot: _profileSnapshot,
      processSnapshot: _processSnapshot,
      model: _model,
      ...modelOwnedReport
    } = buildDeterministicAnalysisReport(input);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify(modelOwnedReport),
          },
        },
      ],
    }), { status: 200 }));

    process.env.DEEPSEEK_API_KEY = "test-key";
    process.env.NEURODIV_MODEL = "deepseek-v4-flash";
    vi.stubGlobal("fetch", fetchMock);

    const parsed = await generateReportWithDeepSeek(input);

    expect(parsed.model).toEqual({
      provider: "deepseek",
      name: "deepseek-v4-flash",
    });
    expect(parsed.profileSnapshot.source).toBe("missing-profile");
    expect(parsed.processSnapshot.inputs.goal).toBe("Ship the analysis report");
    expect(parsed.id).toEqual(expect.any(String));
  });

  it("falls back to deterministic report output when DeepSeek is unavailable", async () => {
    const input = makeInput();
    const response = await generateReportRoute({
      request: new Request("http://localhost/api/generate-report", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    } as Parameters<typeof generateReportRoute>[0]);
    const payload = await response.json();

    expect(payload.source).toBe("deterministic");
    expect(payload.report.model.provider).toBe("deterministic");
    expect(payload.report.processSnapshot.inputs.goal).toBe("Ship the analysis report");
    expect(payload.error).toContain("DEEPSEEK_API_KEY");
  });
});
