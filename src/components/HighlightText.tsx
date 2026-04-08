import type { CSSProperties } from "react";

interface Props {
  text: string;
  className?: string;
  style?: CSSProperties;
}

const paragraphBreak = /\n\s*\n+/;

export function HighlightText({ text, className, style }: Props) {
  const paragraphs = text
    .split(paragraphBreak)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

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
