import { useEffect, useRef } from "react";

interface Props {
  html: string;
  className?: string;
}

/**
 * Renders sanitized HTML visualization with site design tokens injected.
 * Uses a shadow DOM-like approach via an iframe or scoped div to prevent
 * style leakage while ensuring the visualization matches the site aesthetic.
 */
export function VisualRenderer({ html, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Inject CSS custom properties so inline styles can reference them
    const style = document.createElement("style");
    style.textContent = `
      .viz-root {
        --teal: #5B8A8A;
        --terracotta: #B46B58;
        --amber: #C4A484;
        --cream: #F5F0E8;
        --ink: #2D2D2D;
        --ink-light: #4A4A4A;
        --ink-muted: #8A8A8A;
        --rule: #E8E4DC;
        --font-display: "DM Serif Display", Georgia, serif;
        --font-mono: "IBM Plex Mono", monospace;
        font-family: system-ui, -apple-system, sans-serif;
        color: var(--ink);
        line-height: 1.6;
      }
      .viz-root * {
        box-sizing: border-box;
      }
      .viz-root h1, .viz-root h2, .viz-root h3, .viz-root h4 {
        font-family: var(--font-display);
        margin: 0 0 12px;
        color: var(--ink);
      }
      .viz-root p {
        margin: 0 0 10px;
        color: var(--ink-light);
      }
      .viz-root strong {
        color: var(--ink);
        font-weight: 600;
      }
    `;
    container.appendChild(style);

    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  if (!html || html.trim().length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`viz-root ${className || ""}`}
      style={{
        marginTop: 20,
        marginBottom: 20,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
