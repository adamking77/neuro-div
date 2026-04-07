import { useState } from "react";
import { motion } from "framer-motion";
import { Button, Card, TextField, TextArea, Separator, Chip } from "@heroui/react";
import { Check, Copy, CaretDown } from "@phosphor-icons/react";
import type { PhaseResult } from "../types";

interface Props {
  phases: Record<number, PhaseResult>;
}

const BRIEF_SECTIONS = [
  {
    id: "problem",
    label: "The Problem",
    hint: "In customer language, not solution language",
    phaseId: 1,
  },
  {
    id: "enemy",
    label: "The Enemy",
    hint: "What worldview or approach is being displaced",
    phaseId: 2,
  },
  {
    id: "landscape",
    label: "The Landscape",
    hint: "Who's adjacent, what's named, what the edges look like",
    phaseId: 3,
  },
  {
    id: "whitespace",
    label: "The White Space",
    hint: "The unclaimed combination of problem + solution",
    phaseId: null,
  },
  {
    id: "evidence",
    label: "The Evidence Stack",
    hint: "Proof the problem is real and growing",
    phaseId: 5,
  },
  {
    id: "vocabulary",
    label: "The Vocabulary Set",
    hint: "Candidate words for naming the category",
    phaseId: 6,
  },
  {
    id: "pov",
    label: "The POV Thesis",
    hint: "One paragraph: broken world → enemy → new way",
    phaseId: null,
  },
];

export function BriefBuilder({ phases }: Props) {
  const [brief, setBrief] = useState<Record<string, string>>(
    Object.fromEntries(BRIEF_SECTIONS.map((s) => [s.id, ""]))
  );
  const [copied, setCopied] = useState(false);

  const completedPhases = Object.values(phases).filter(
    (p) => p.status === "done"
  ).length;

  const exportMarkdown = () => {
    const lines = BRIEF_SECTIONS.map(
      (s) => `## ${s.label}\n\n${brief[s.id] || "_Not yet written_"}\n`
    );
    navigator.clipboard.writeText(
      `# Category Design Brief\n\n${lines.join("\n")}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="px-8 py-8 max-w-[720px]"
      style={{ fontFamily: "Geist, system-ui, sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <h1
            className="text-[18px] font-semibold tracking-tight mb-1"
            style={{ color: "var(--foreground)" }}
          >
            Category Design Brief
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[13px]" style={{ color: "var(--muted)" }}>
              {completedPhases} of 6 phases complete
            </span>
            {completedPhases > 0 && (
              <Chip size="sm" color="success" variant="soft">
                {completedPhases}/6
              </Chip>
            )}
          </div>
        </div>

        <Button
          onPress={exportMarkdown}
          variant="outline"
          size="sm"
          className="shrink-0"
        >
          {copied ? (
            <>
              <Check size={13} style={{ color: "oklch(73.2% 0.19 150.81)" }} />
              <span style={{ color: "oklch(73.2% 0.19 150.81)" }}>Copied</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              Copy as Markdown
            </>
          )}
        </Button>
      </div>

      <Separator variant="tertiary" className="mb-6" />

      {/* Sections */}
      <div className="space-y-4">
        {BRIEF_SECTIONS.map((section, i) => {
          const phaseData =
            section.phaseId != null ? phases[section.phaseId] : null;
          const hasData =
            phaseData?.status === "done" && phaseData.results.length > 0;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * 0.04,
                type: "spring",
                stiffness: 180,
                damping: 26,
              }}
            >
              <Card variant="secondary" className="overflow-hidden">
                <Card.Content className="px-5 py-4 space-y-3">
                  {/* Section header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] tabular-nums font-mono"
                        style={{ color: "oklch(35% 0.005 286)" }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="text-[12px] font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        {section.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasData && (
                        <Chip size="sm" color="success" variant="soft">
                          {phaseData!.results.length} sources
                        </Chip>
                      )}
                      <span
                        className="text-[11px]"
                        style={{ color: "oklch(38% 0.005 286)" }}
                      >
                        {section.hint}
                      </span>
                    </div>
                  </div>

                  {/* Text input */}
                  <TextField
                    value={brief[section.id]}
                    onChange={(v) =>
                      setBrief((b) => ({ ...b, [section.id]: v }))
                    }
                    className="w-full"
                  >
                    <TextArea
                      placeholder="Write your synthesis here…"
                      rows={4}
                      className="resize-none text-[13px]"
                      aria-label={section.label}
                    />
                  </TextField>

                  {/* Source accordion */}
                  {hasData && (
                    <SourceAccordion
                      results={phaseData!.results.slice(0, 8)}
                      phaseId={section.phaseId!}
                    />
                  )}
                </Card.Content>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function SourceAccordion({
  results,
  phaseId,
}: {
  results: any[];
  phaseId: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((x) => !x)}
        className="flex items-center gap-1.5 transition-colors duration-150"
        style={{ color: "oklch(38% 0.005 286)" }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.color = "oklch(55% 0.01 286)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.color = "oklch(38% 0.005 286)")
        }
      >
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="inline-block"
        >
          <CaretDown size={10} weight="bold" />
        </motion.span>
        <span className="text-[11px]">
          Phase {String(phaseId).padStart(2, "0")} source highlights
        </span>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ type: "spring", stiffness: 200, damping: 28 }}
          className="mt-2.5 space-y-2 max-h-52 overflow-y-auto"
        >
          {results.map((r) => {
            const domain = (() => {
              try {
                return new URL(r.url).hostname.replace(/^www\./, "");
              } catch {
                return r.url;
              }
            })();

            return (
              <div
                key={r.id}
                className="pl-3 border-l"
                style={{ borderColor: "var(--separator)" }}
              >
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-mono transition-colors duration-150"
                  style={{ color: "oklch(50% 0.01 286)", textDecoration: "none" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      "oklch(73.2% 0.19 150.81)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      "oklch(50% 0.01 286)")
                  }
                >
                  {domain}
                </a>
                {r.highlights?.[0] && (
                  <p
                    className="text-[11px] leading-relaxed mt-0.5 line-clamp-2"
                    style={{ color: "oklch(38% 0.005 286)" }}
                  >
                    {r.highlights[0]}
                  </p>
                )}
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
