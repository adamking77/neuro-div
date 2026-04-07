import {
  Button,
  TextField,
  Label,
  Input,
  TextArea,
  Separator,
  Spinner,
  Chip,
} from "@heroui/react";
import {
  MapPin,
  Sword,
  Globe,
  ClipboardText,
  ChartBar,
  TextAa,
  FileText,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import type { SessionState } from "../types";
import { PHASES } from "../phases";
import type { MainView } from "../App";

const PHASE_ICONS = [MapPin, Sword, Globe, ClipboardText, ChartBar, TextAa];

const STATUS_STYLE: Record<string, { dot: string; label: string }> = {
  idle:    { dot: "oklch(72% 0.007 286)",     label: "" },
  running: { dot: "oklch(55% 0.15 220)",      label: "running" },
  done:    { dot: "oklch(52% 0.17 150.81)",   label: "" },
  error:   { dot: "oklch(55% 0.2 25)",        label: "error" },
};

interface Props {
  session: SessionState;
  view: MainView;
  isRunning: boolean;
  hasResults: boolean;
  onProblemChange: (v: string) => void;
  onKnownPlayersChange: (v: string) => void;
  onRunAll: () => void;
  onReset: () => void;
  onSetView: (v: MainView) => void;
}

export function Sidebar({
  session,
  view,
  isRunning,
  hasResults,
  onProblemChange,
  onKnownPlayersChange,
  onRunAll,
  onReset,
  onSetView,
}: Props) {
  const completedCount = Object.values(session.phases).filter(
    (p) => p.status === "done"
  ).length;

  const canRun = !!session.problem.trim() && !isRunning;

  return (
    <div
      className="w-[256px] shrink-0 flex flex-col h-full"
      style={{
        background: "oklch(22% 0.01 270 / 0.88)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        borderRight: "1px solid oklch(100% 0 0 / 0.1)",
        boxShadow: "4px 0 24px oklch(0% 0 0 / 0.12)",
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{
              background: "oklch(52% 0.17 150.81 / 0.18)",
              border: "1px solid oklch(52% 0.17 150.81 / 0.35)",
            }}
          >
            <div className="w-2 h-2 rounded-sm" style={{ background: "oklch(62% 0.19 150.81)" }} />
          </div>
          <span className="text-[13px] font-semibold tracking-tight" style={{ color: "oklch(94% 0.006 286)" }}>
            Category Scout
          </span>
        </div>
      </div>

      <Separator variant="secondary" />

      {/* Inputs */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        <TextField value={session.problem} onChange={onProblemChange} className="w-full">
          <Label
            className="text-[10px] font-medium uppercase tracking-widest"
            style={{ color: "oklch(65% 0.008 286)" }}
          >
            Problem
          </Label>
          <TextArea
            placeholder="Describe in customer language…"
            rows={3}
            className="resize-none text-[12px]"
            style={{ color: "oklch(88% 0.006 286)" }}
          />
        </TextField>

        <TextField value={session.knownPlayers} onChange={onKnownPlayersChange} className="w-full">
          <Label
            className="text-[10px] font-medium uppercase tracking-widest flex items-center gap-1"
            style={{ color: "oklch(65% 0.008 286)" }}
          >
            Known Players
            <span className="normal-case font-normal text-[9px] opacity-60">optional</span>
          </Label>
          <Input
            placeholder="McKinsey, Accenture…"
            className="text-[12px]"
            style={{ color: "oklch(88% 0.006 286)" }}
          />
        </TextField>
      </div>

      <Separator variant="secondary" />

      {/* Phase status list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {PHASES.map((phase, i) => {
          const Icon = PHASE_ICONS[i];
          const result = session.phases[phase.id];
          const { dot, label } = STATUS_STYLE[result.status];

          return (
            <div key={phase.id} className="flex items-center gap-2.5 py-1.5">
              <span
                className="text-[10px] tabular-nums shrink-0 font-mono w-4"
                style={{ color: "oklch(45% 0.006 286)" }}
              >
                {String(phase.id).padStart(2, "0")}
              </span>
              <Icon size={12} weight="regular" className="shrink-0" style={{ color: "oklch(55% 0.007 286)" }} />
              <span
                className="text-[12px] flex-1 truncate"
                style={{ color: result.status === "done" ? "oklch(92% 0.006 286)" : "oklch(60% 0.008 286)" }}
              >
                {phase.name}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {result.status === "done" && result.results.length > 0 && (
                  <span className="text-[9px] tabular-nums font-mono" style={{ color: "oklch(55% 0.006 286)" }}>
                    {result.results.length}
                  </span>
                )}
                {label && (
                  <span className="text-[9px] font-mono" style={{ color: dot }}>{label}</span>
                )}
                <span
                  className={`w-1.5 h-1.5 rounded-full ${result.status === "running" ? "animate-pulse" : ""}`}
                  style={{ background: dot }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Separator variant="secondary" />

      {/* Bottom actions */}
      <div className="px-3 py-3 space-y-2">
        {/* Brief */}
        <button
          onClick={() => onSetView(view === "brief" ? "report" : "brief")}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors duration-150"
          style={{
            background: view === "brief" ? "oklch(100% 0 0 / 0.1)" : "transparent",
            color: view === "brief" ? "oklch(92% 0.006 286)" : "oklch(58% 0.008 286)",
          }}
        >
          <FileText size={13} className="shrink-0" />
          <span className="text-[12px] font-medium flex-1">Category Brief</span>
          {completedCount > 0 && (
            <Chip size="sm" color="success" variant="soft" className="text-[9px] h-4 px-1.5">
              {completedCount}/6
            </Chip>
          )}
        </button>

        {/* Run All */}
        <Button
          onPress={onRunAll}
          isDisabled={!canRun}
          variant="secondary"
          size="sm"
          className="w-full"
          style={
            canRun
              ? {
                  background: "oklch(52% 0.17 150.81 / 0.15)",
                  borderColor: "oklch(52% 0.17 150.81 / 0.3)",
                  color: "oklch(72% 0.19 150.81)",
                }
              : undefined
          }
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" color="current" />
              Running…
            </span>
          ) : hasResults ? (
            "Re-run All"
          ) : (
            "Run"
          )}
        </Button>

        {/* Reset */}
        <Button
          onPress={onReset}
          variant="ghost"
          size="sm"
          className="w-full text-[11px]"
          style={{ color: "oklch(48% 0.006 286)" }}
        >
          <ArrowCounterClockwise size={11} className="mr-1" />
          Reset
        </Button>
      </div>
    </div>
  );
}
