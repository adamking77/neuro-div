import type { SessionState } from "../types";
import { PHASES } from "../phases";

const STOP_WORDS = new Set([
  "the","a","an","is","are","was","were","be","been","being","have","has","had","do","does","did","will","would","could","should","may","might","must","can","need","to","of","in","for","on","with","at","by","from","as","into","through","during","before","after","above","below","between","under","again","further","then","once","here","there","when","where","why","how","all","each","few","more","most","other","some","such","no","nor","not","only","own","same","so","than","too","very","just","and","but","if","or","because","until","while","this","that","these","those","what","which","who","whom","whose","any","both","either","neither","one","two","also","new","way","make","get","go","come","take","know","think","see","want","use","work","find","give","tell","become","leave","feel","put","mean","keep","let","begin","seem","help","show","hear","play","run","move","live","believe","bring","happen","write","provide","sit","stand","lose","pay","meet","include","continue","set","learn","change","lead","understand","watch","follow","stop","create","speak","read","allow","add","spend","grow","open","walk","win","offer","remember","love","consider","appear","buy","wait","serve","die","send","expect","build","stay","fall","cut","reach","kill","remain","suggest","raise","pass","sell","require","report","decide","pull","their","them","about","out","up","down","off","over","even","back","still","well","much","many","said","each","which","their","time","will","about","if","up","out","many","then","them","these","so","some","her","would","make","like","into","him","has","two","more","very","what","know","just","first","get","over","think","also","its","after","back","other","many","than","only","those","come","day","most","us","good","way","even","new","want","because","any","give","day","most","us","good","way","even","new","want","because","any","give","through","when","much","too","here","off","own","say","great","where","much","too","were","she","may","say","great","where","being","every","both","done","another","upon","around","does","done","against","himself","however","nothing","myself","cannot","everything","something","someone","everyone","anyone","anything","everything","nothing","somebody","anybody","everybody","nobody","somewhere","anywhere","everywhere","nowhere","perhaps","almost","rather","quite","enough","already","always","never","sometimes","often","usually","soon","now","then","everywhere","anywhere","somewhere","elsewhere","however","therefore","moreover","furthermore","nevertheless","otherwise","instead","meanwhile","besides","nonetheless","accordingly","consequently","hence","thus","since","unless","although","though","whereas","whether","like","unlike","despite","regardless","via","per","among","within","without","against","toward","towards","across","around","behind","beyond","beside","inside","outside","upon","onto","throughout","along","amongst","amid","amidst","concerning","regarding","respecting","considering","following","pending","during","except","excluding","including","plus","minus","times","divided","equals","plus","versus","vs","etc","et","al","ie","eg","viz","namely","specifically","particularly","especially","notably","mainly","mostly","largely","partly","entirely","completely","totally","absolutely","relatively","comparatively","extremely","highly","deeply","strongly","widely","broadly","generally","typically","normally","commonly","frequently","regularly","repeatedly","consistently","constantly","continuously","increasingly","decreasingly","rapidly","slowly","quickly","easily","difficultly","hardly","barely","scarcely","merely","simply","purely","clearly","obviously","apparently","evidently","presumably","supposedly","allegedly","reportedly","potentially","possibly","probably","likely","unlikely","certainly","surely","definitely","undoubtedly","obviously","clearly","plainly","frankly","honestly","seriously","literally","figuratively","metaphorically","ironically","curiously","interestingly","surprisingly","astonishingly","amazingly","remarkably","notably","strikingly","dramatically","radically","fundamentally","essentially","basically","primarily","principally","chiefly","mainly","mostly","largely","partly","partially","fully","wholly","entirely","completely","totally","utterly","absolutely","relatively","fairly","pretty","quite","rather","somewhat","slightly","bit","little","lot","great","deal","people","said","each","which","their","time","will","would","there","year","years","them","than","them","them",
]);

function extractThemes(highlights: string[]): string[] {
  const counts = new Map<string, number>();
  for (const h of highlights) {
    const words = h
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
    for (const w of words) {
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
}

function formatDateRange(dates: string[]): string | null {
  const valid = dates
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  if (valid.length === 0) return null;
  const oldest = valid[0];
  const newest = valid[valid.length - 1];
  const sameYear = oldest.getFullYear() === newest.getFullYear();
  if (sameYear) {
    return `${oldest.toLocaleDateString("en-US", { month: "short" })}–${newest.toLocaleDateString("en-US", { month: "short" })} ${oldest.getFullYear()}`;
  }
  return `${oldest.getFullYear()}–${newest.getFullYear()}`;
}

function getSignalStrength(doneCount: number, totalResults: number, totalHighlights: number): { label: string; variant: "teal" | "medium" | "terracotta" } {
  if (doneCount >= 4 && totalResults >= 20 && totalHighlights >= 15) {
    return { label: "Strong signal", variant: "teal" };
  }
  if (doneCount >= 2 && totalResults >= 8) {
    return { label: "Mixed signal", variant: "medium" };
  }
  return { label: "Thin evidence", variant: "terracotta" };
}

export function ResearchSynthesis({ session }: { session: SessionState }) {
  const donePhases = PHASES.filter((p) => session.phases[p.id]?.status === "done" && session.phases[p.id].results.length > 0);
  const totalResults = donePhases.reduce((sum, p) => sum + session.phases[p.id].results.length, 0);
  const totalHighlights = donePhases.reduce(
    (sum, p) => sum + session.phases[p.id].results.reduce((hSum, r) => hSum + (r.highlights?.length ?? 0), 0),
    0,
  );

  if (donePhases.length === 0) return null;

  const allHighlights = donePhases.flatMap((p) =>
    session.phases[p.id].results.flatMap((r) => r.highlights ?? []),
  );
  const themes = extractThemes(allHighlights);

  const domains = Array.from(
    new Set(
      donePhases.flatMap((p) =>
        session.phases[p.id].results.map((r) => {
          try {
            return new URL(r.url).hostname.replace(/^www\./, "");
          } catch {
            return null;
          }
        }),
      ),
    ),
  ).filter(Boolean) as string[];

  const dates = donePhases.flatMap((p) =>
    session.phases[p.id].results.map((r) => r.publishedDate).filter(Boolean),
  ) as string[];
  const dateRange = formatDateRange(dates);

  const signal = getSignalStrength(donePhases.length, totalResults, totalHighlights);

  const strongPhases = donePhases.filter((p) => session.phases[p.id].results.length >= 4);
  const weakPhases = donePhases.filter((p) => session.phases[p.id].results.length < 3);

  const signalColors: Record<string, { bg: string; text: string; border: string }> = {
    teal: { bg: "rgba(91,138,138,0.08)", text: "var(--teal-deep)", border: "rgba(91,138,138,0.2)" },
    medium: { bg: "var(--warning-bg)", text: "var(--warning-deep)", border: "var(--warning-pill)" },
    terracotta: { bg: "rgba(180,107,88,0.08)", text: "var(--terracotta)", border: "rgba(180,107,88,0.2)" },
  };
  const sc = signalColors[signal.variant];

  return (
    <div style={{ marginBottom: 36 }}>
      <div
        style={{
          background: sc.bg,
          border: `1px solid ${sc.border}`,
          padding: "18px 20px",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: sc.text,
              padding: "3px 10px",
              border: `1px solid ${sc.border}`,
              borderRadius: 999,
            }}
          >
            {signal.label}
          </span>
          <span className="mono" style={{ fontSize: 10, color: "var(--ink-muted)" }}>
            {donePhases.length}/{PHASES.length} phases · {totalResults} sources · {totalHighlights} excerpts
          </span>
          {dateRange && (
            <span className="mono" style={{ fontSize: 10, color: "var(--ink-muted)" }}>
              {dateRange}
            </span>
          )}
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {strongPhases.length > 0 && (
            <p style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: "var(--ink)" }}>Strongest coverage:</strong>{" "}
              {strongPhases.map((p) => p.name).join(", ")}
              {strongPhases.length === 1 ? " has" : " have"} the most source material.
            </p>
          )}

          {weakPhases.length > 0 && (
            <p style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: "var(--ink)" }}>Thin coverage:</strong>{" "}
              {weakPhases.map((p) => p.name).join(", ")}
              {weakPhases.length === 1 ? " needs" : " need"} a re-run or refined query.
            </p>
          )}

          {themes.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "var(--ink-light)" }}>
                <strong style={{ color: "var(--ink)" }}>Recurring themes:</strong>
              </span>
              {themes.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    color: "var(--ink-muted)",
                    border: "1px solid var(--rule)",
                    padding: "2px 8px",
                    borderRadius: 999,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {domains.length > 0 && (
            <p style={{ fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.55, margin: 0 }}>
              Sources from {domains.length} unique domain{domains.length > 1 ? "s" : ""}
              {domains.length <= 6 ? `: ${domains.join(", ")}` : ", including " + domains.slice(0, 5).join(", ") + ` and ${domains.length - 5} more`}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
