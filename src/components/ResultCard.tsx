import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button } from "@heroui/react";
import { ArrowUpRight, CaretDown } from "@phosphor-icons/react";
import type { ExaResult } from "../types";

interface Props {
  result: ExaResult;
}

export function ResultCard({ result }: Props) {
  const [expanded, setExpanded] = useState(false);

  const domain = (() => {
    try {
      return new URL(result.url).hostname.replace(/^www\./, "");
    } catch {
      return result.url.slice(0, 40);
    }
  })();

  const dateStr = result.publishedDate
    ? new Date(result.publishedDate).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  const hasHighlights = result.highlights && result.highlights.length > 0;

  return (
    <Card
      variant="secondary"
      className="overflow-hidden transition-all duration-200 hover:brightness-110"
    >
      <Card.Content className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Title + link */}
            <a
              href={result.url}
              target="_blank"
              rel="noreferrer"
              className="group/link flex items-start gap-1.5"
              style={{ textDecoration: "none" }}
            >
              <span
                className="text-[13px] font-medium leading-snug line-clamp-2 transition-colors duration-150"
                style={{ color: "oklch(75% 0.01 286)" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "var(--foreground)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "oklch(75% 0.01 286)")
                }
              >
                {result.title || result.url}
              </span>
              <ArrowUpRight
                size={11}
                className="shrink-0 mt-0.5"
                style={{ color: "oklch(35% 0.005 286)" }}
              />
            </a>

            {/* Meta row */}
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className="text-[11px] font-mono"
                style={{ color: "oklch(42% 0.005 286)" }}
              >
                {domain}
              </span>
              {dateStr && (
                <>
                  <span style={{ color: "oklch(28% 0.005 286)", fontSize: 10 }}>·</span>
                  <span
                    className="text-[11px] font-mono"
                    style={{ color: "oklch(37% 0.005 286)" }}
                  >
                    {dateStr}
                  </span>
                </>
              )}
              {result.score != null && (
                <>
                  <span style={{ color: "oklch(28% 0.005 286)", fontSize: 10 }}>·</span>
                  <span
                    className="text-[11px] tabular-nums font-mono"
                    style={{ color: "oklch(32% 0.005 286)" }}
                  >
                    {(result.score * 100).toFixed(0)}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Expand toggle */}
          {hasHighlights && (
            <Button
              onPress={() => setExpanded((x) => !x)}
              variant="ghost"
              isIconOnly
              size="sm"
              className="shrink-0 mt-0.5 w-6 h-6 min-w-0"
              style={{ color: "oklch(38% 0.005 286)" }}
            >
              <motion.div
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <CaretDown size={11} weight="bold" />
              </motion.div>
            </Button>
          )}
        </div>

        {/* First highlight (collapsed) */}
        {hasHighlights && !expanded && (
          <p
            className="mt-2.5 text-[12px] leading-relaxed line-clamp-2 border-l-2 pl-3"
            style={{
              color: "oklch(45% 0.005 286)",
              borderColor: "oklch(73.2% 0.19 150.81 / 0.25)",
            }}
          >
            {result.highlights![0]}
          </p>
        )}
      </Card.Content>

      {/* Expanded highlights */}
      <AnimatePresence>
        {expanded && hasHighlights && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 pt-3 space-y-2.5"
              style={{ borderTop: "1px solid var(--separator)" }}
            >
              {result.highlights!.map((h, i) => (
                <p
                  key={i}
                  className="text-[12px] leading-relaxed border-l-2 pl-3"
                  style={{
                    color: "oklch(50% 0.005 286)",
                    borderColor: "oklch(73.2% 0.19 150.81 / 0.2)",
                  }}
                >
                  {h}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
