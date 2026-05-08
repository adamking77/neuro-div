import type { IntelligenceLandscapeCallout } from "../types";

interface Props {
  content: string;
  callouts: IntelligenceLandscapeCallout[];
}

const CALLOUT_STYLES: Record<string, { border: string; bg: string; icon: string }> = {
  insight: { border: "var(--teal)", bg: "rgba(91, 138, 138, 0.06)", icon: "●" },
  warning: { border: "var(--terracotta)", bg: "rgba(180, 107, 88, 0.06)", icon: "▲" },
  opportunity: { border: "#b8860b", bg: "rgba(196, 164, 132, 0.08)", icon: "◆" },
};

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function splitIntoParagraphs(text: string, sentencesPerParagraph = 2) {
  const explicitParagraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (explicitParagraphs.length > 1) {
    return explicitParagraphs;
  }

  const sentences = splitIntoSentences(text);
  if (sentences.length <= 2) {
    return [text.trim()];
  }

  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
    paragraphs.push(sentences.slice(i, i + sentencesPerParagraph).join(" "));
  }

  return paragraphs;
}

function buildCalloutContent(text: string) {
  const paragraphs = splitIntoParagraphs(text, 2);
  const [lead, ...rest] = paragraphs;

  return {
    lead: lead ?? text.trim(),
    rest,
  };
}

export function IntelligenceNarrative({ content, callouts }: Props) {
  const paragraphs = content.split("\n\n").filter(Boolean);

  return (
    <div>
      {paragraphs.map((paragraph, i) => (
        <p
          key={i}
          style={{
            fontSize: 14,
            color: "var(--ink)",
            lineHeight: 1.75,
            margin: "0 0 16px",
          }}
        >
          {paragraph}
        </p>
      ))}

      {callouts.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginTop: 24,
          }}
        >
          {callouts.map((callout, i) => {
            const style = CALLOUT_STYLES[callout.type] ?? CALLOUT_STYLES.insight;
            const label = callout.type.charAt(0).toUpperCase() + callout.type.slice(1);
            const calloutContent = buildCalloutContent(callout.text);
            return (
              <div
                key={i}
                style={{
                  border: `1px solid ${style.border}`,
                  background: style.bg,
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <span style={{ color: style.border }}>{style.icon}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--ink-muted)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {label}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 12.5,
                    color: "var(--ink)",
                    lineHeight: 1.65,
                    margin: 0,
                    fontWeight: 600,
                  }}
                >
                  {calloutContent.lead}
                </p>
                {calloutContent.rest.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                    {calloutContent.rest.map((paragraph, paragraphIndex) => (
                      <p
                        key={paragraphIndex}
                        style={{
                          fontSize: 12.5,
                          color: "var(--ink-light)",
                          lineHeight: 1.65,
                          margin: 0,
                        }}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
