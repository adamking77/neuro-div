import type { CSSProperties } from "react";

interface Props {
  text: string;
  className?: string;
  style?: CSSProperties;
}

const paragraphBreak = /\n\s*\n+/;
const sentenceBreak = /(?<=[.!?])\s+(?=[A-Z0-9"'(\[])/;

function buildParagraphs(text: string) {
  const explicitParagraphs = text
    .split(paragraphBreak)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

  if (explicitParagraphs.length > 1) return explicitParagraphs;

  const normalized = text.replace(/\s*\n\s*/g, " ").trim();
  const sentences = normalized
    .split(sentenceBreak)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length < 3 || normalized.length < 220) {
    return explicitParagraphs;
  }

  const paragraphs: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (current && (current.length >= 220 || next.length >= 320)) {
      paragraphs.push(current);
      current = sentence;
      continue;
    }
    current = next;
  }

  if (current) paragraphs.push(current);
  return paragraphs;
}

export function HighlightText({ text, className, style }: Props) {
  const paragraphs = buildParagraphs(text);

  if (paragraphs.length <= 1) {
    return (
      <p className={className} style={{ ...style, margin: 0, whiteSpace: "pre-line" }}>
        {text}
      </p>
    );
  }

  return (
    <div
      className={className}
      style={{ ...style, display: "flex", flexDirection: "column", gap: 10 }}
    >
      {paragraphs.map((paragraph, index) => (
        <p key={index} style={{ margin: 0 }}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
