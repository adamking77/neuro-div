import type { IntelligenceLandscapeCallout } from "../types";

interface Props {
  content: string;
  callouts: IntelligenceLandscapeCallout[];
}

const CALLOUT_STYLES: Record<string, { border: string; bg: string; icon: string }> = {
  insight: { border: "var(--teal)", bg: "rgba(91, 138, 138, 0.06)", icon: "●" },
  warning: { border: "var(--terracotta)", bg: "rgba(180, 107, 88, 0.06)", icon: "▲" },
  opportunity: { border: "var(--warning)", bg: "var(--warning-bg)", icon: "◆" },
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
  if (sentences.length === 0) {
    return text
      .split(/(?<=,)\s+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .reduce<string[]>((chunks, paragraph) => {
        const current = chunks[chunks.length - 1];
        if (!current || current.length > 180) {
          chunks.push(paragraph);
        } else {
          chunks[chunks.length - 1] = `${current} ${paragraph}`;
        }
        return chunks;
      }, []);
  }

  if (sentences.length <= 2 && text.length < 220) {
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
  const paragraphs = splitIntoParagraphs(content, 2);

  return (
    <div style={{ maxWidth: 780 }}>
      {paragraphs.map((paragraph, i) => (
        <p
          key={i}
          style={{
            fontSize: 14,
            color: "var(--ink)",
            lineHeight: 1.75,
            margin: "0 0 16px",
            maxWidth: 74 + "ch",
            overflowWrap: "anywhere",
          }}
        >
          {paragraph}
        </p>
      ))}

      {callouts.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
            marginTop: 24,
            maxWidth: 780,
          }}
        >
          {callouts.map((callout, i) => {
            const style = CALLOUT_STYLES[callout.type] ?? CALLOUT_STYLES.insight;
            const label = callout.type.charAt(0).toUpperCase() + callout.type.slice(1);
            const legacyText = callout.text ?? "";
            const headline = callout.headline || buildCalloutContent(legacyText).lead;
            const support = callout.support
              ? [callout.support]
              : buildCalloutContent(legacyText).rest;
            const isLong = `${headline} ${support.join(" ")}`.length > 220;
            return (
              <div
                key={i}
                style={{
                  border: `1px solid ${style.border}`,
                  background: style.bg,
                  padding: "14px 16px",
                  gridColumn: isLong ? "1 / -1" : undefined,
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
                    maxWidth: 62 + "ch",
                    overflowWrap: "anywhere",
                  }}
                >
                  {headline}
                </p>
                {support.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                    {support.map((paragraph, paragraphIndex) => (
                      <p
                        key={paragraphIndex}
                        style={{
                          fontSize: 12.5,
                          color: "var(--ink-light)",
                          lineHeight: 1.65,
                          margin: 0,
                          maxWidth: 68 + "ch",
                          overflowWrap: "anywhere",
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
