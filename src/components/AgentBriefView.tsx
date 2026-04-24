import { useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  markdown: string;
}

export function AgentBriefView({ markdown }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!markdown) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <p
          style={{
            fontSize: 14,
            color: "var(--ink-muted)",
            margin: "0 0 8px",
            fontFamily: "var(--font-display)",
          }}
        >
          No agent brief available
        </p>
        <p
          style={{
            fontSize: 12,
            color: "var(--ink-muted)",
            opacity: 0.7,
            margin: 0,
            maxWidth: 420,
            marginInline: "auto",
            lineHeight: 1.6,
          }}
        >
          Generate a strategy draft first. The agent brief is derived from your draft and contains PDA-aware execution instructions for AI agents like Claude Code or Cursor.
        </p>
      </div>
    );
  }

  const sections = parseAgentBriefSections(markdown);

  return (
    <div>
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          padding: "14px 18px",
          background: "var(--cream)",
          border: "1px solid var(--rule)",
          borderRadius: 8,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "var(--font-display)",
              color: "var(--ink)",
              margin: "0 0 2px",
            }}
          >
            Agent Brief
          </p>
          <p
            style={{
              fontSize: 11,
              color: "var(--ink-muted)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Copy and paste into Claude Code, Cursor, or any AI agent
          </p>
        </div>
        <button
          onClick={handleCopy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 999,
            border: "1px solid var(--rule)",
            background: copied ? "var(--teal)" : "transparent",
            color: copied ? "#fff" : "var(--ink-muted)",
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.04em",
            transition: "background 0.15s, color 0.15s, border-color 0.15s",
            flexShrink: 0,
          }}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                style={{ display: "inline-flex" }}
              >
                <Check size={13} weight="bold" />
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                style={{ display: "inline-flex" }}
              >
                <Copy size={13} />
              </motion.span>
            )}
          </AnimatePresence>
          {copied ? "Copied" : "Copy markdown"}
        </button>
      </div>

      {/* Rendered sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {sections.map((section, i) => (
          <AgentBriefSection key={i} section={section} />
        ))}
      </div>
    </div>
  );
}

interface ParsedSection {
  level: number;
  title: string;
  content: string;
}

function parseAgentBriefSections(markdown: string): ParsedSection[] {
  const lines = markdown.split("\n");
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;
  const contentLines: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      if (current) {
        current.content = contentLines.join("\n").trim();
        sections.push(current);
        contentLines.length = 0;
      }
      current = {
        level: headingMatch[1].length,
        title: headingMatch[2].trim(),
        content: "",
      };
    } else if (current) {
      contentLines.push(line);
    }
  }

  if (current) {
    current.content = contentLines.join("\n").trim();
    sections.push(current);
  }

  return sections;
}

function AgentBriefSection({ section }: { section: ParsedSection }) {
  const isTopLevel = section.level === 1;
  const isH2 = section.level === 2;

  return (
    <div
      style={{
        padding: isTopLevel ? "0" : "16px 20px",
        background: isTopLevel ? "transparent" : "var(--cream)",
        border: isTopLevel ? "none" : "1px solid var(--rule)",
        borderRadius: 6,
      }}
    >
      <h2
        style={{
          fontSize: isH2 ? 14 : 16,
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          color: isTopLevel ? "var(--ink)" : "var(--ink)",
          margin: "0 0 12px",
          letterSpacing: isH2 ? "0" : "-0.01em",
        }}
      >
        {section.title}
      </h2>
      <div style={{ fontSize: 13, lineHeight: 1.75, color: "var(--ink-light)" }}>
        <FormattedMarkdown content={section.content} />
      </div>
    </div>
  );
}

function FormattedMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    // Bullet list
    if (trimmed.startsWith("- ")) {
      const text = trimmed.slice(2);
      elements.push(
        <p key={i} style={{ margin: "0 0 6px", paddingLeft: 16, position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 0,
              top: "0.6em",
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--ink-muted)",
            }}
          />
          <InlineMarkdown text={text} />
        </p>,
      );
      continue;
    }

    // Numbered list
    const numberedMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (numberedMatch) {
      elements.push(
        <p key={i} style={{ margin: "0 0 6px", paddingLeft: 20, position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ink-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {trimmed.match(/^\d+/)?.[0]}.
          </span>
          <InlineMarkdown text={numberedMatch[1]} />
        </p>,
      );
      continue;
    }

    // Blockquote / callout
    if (trimmed.startsWith("> ")) {
      const text = trimmed.slice(2);
      elements.push(
        <div
          key={i}
          style={{
            borderLeft: "3px solid var(--teal)",
            padding: "10px 14px",
            margin: "8px 0",
            background: "rgba(91, 138, 138, 0.06)",
            borderRadius: "0 4px 4px 0",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: "var(--ink)" }}>
            <InlineMarkdown text={text} />
          </p>
        </div>,
      );
      continue;
    }

    // Horizontal rule
    if (trimmed === "---") {
      elements.push(<hr key={i} className="rule" style={{ margin: "12px 0" }} />);
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} style={{ margin: "0 0 10px", color: "var(--ink-light)" }}>
        <InlineMarkdown text={trimmed} />
      </p>,
    );
  }

  return <>{elements}</>;
}

function InlineMarkdown({ text }: { text: string }) {
  // Handle bold, links, and plain text
  const parts = text.split(/(\*\*[^*]+\*\*|\[([^\]]+)\]\(([^)]+)\))/g);
  const result: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    // Bold: **text**
    if (part.startsWith("**") && part.endsWith("**")) {
      result.push(
        <strong key={i} style={{ color: "var(--ink)", fontWeight: 650 }}>
          {part.slice(2, -2)}
        </strong>,
      );
      continue;
    }

    // Link: [text](url) — the regex split produces separate groups, so we handle it differently
    // Actually, the split pattern captures groups separately. Let me simplify.
    result.push(<span key={i}>{part}</span>);
  }

  // Post-process for links
  return <LinkProcessor>{result}</LinkProcessor>;
}

function LinkProcessor({ children }: { children: React.ReactNode[] }) {
  const processed: React.ReactNode[] = [];

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (
      child &&
      typeof child === "object" &&
      "props" in child &&
      child.props &&
      typeof child.props === "object" &&
      "children" in child.props &&
      typeof child.props.children === "string"
    ) {
      const text = child.props.children;
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;

      while ((match = linkRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          parts.push(<span key={`${i}-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
        }
        parts.push(
          <a
            key={`${i}-${match.index}`}
            href={match[2]}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--teal)", textDecoration: "none", fontWeight: 500 }}
          >
            {match[1]}
          </a>,
        );
        lastIndex = linkRegex.lastIndex;
      }

      if (lastIndex < text.length) {
        parts.push(<span key={`${i}-end`}>{text.slice(lastIndex)}</span>);
      }

      if (parts.length > 0) {
        processed.push(<span key={i}>{parts}</span>);
        continue;
      }
    }
    processed.push(child);
  }

  return <>{processed}</>;
}
