'use client';

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PencilSimple, Plus, Trash, X } from "@phosphor-icons/react";
import type { SavedProject } from "../lib/storage";

export function RunButton({
  canRun,
  isRunning,
  hasAnyResults,
  onClick,
}: {
  canRun: boolean;
  isRunning: boolean;
  hasAnyResults: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={canRun ? onClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: "var(--font-display)",
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: "0.01em",
        padding: "10px 52px",
        border: "none",
        borderRadius: 999,
        cursor: canRun ? "pointer" : "not-allowed",
        background: canRun ? (hovered ? "#3D6B6B" : "#5B8A8A") : "rgba(91, 138, 138, 0.4)",
        color: "#fff",
        transition: "background 0.15s",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        userSelect: "none",
      }}
    >
      {isRunning
        ? (
          <>
            <span className="spinner" style={{ width: 14, height: 14 }} />
            <span>Running…</span>
          </>
        )
        : hasAnyResults ? "Re-run All" : "Run"}
    </button>
  );
}

export function ToolSection({
  number,
  label,
  description,
  statusChip,
  headerActions,
  children,
}: {
  number?: string;
  label: string;
  description: string;
  statusChip?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
            padding: "28px 0 24px",
            textAlign: "left",
          }}
        >
          {number && (
            <span
              className="mono"
              style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--ink-muted)", flexShrink: 0, paddingTop: 5 }}
            >
              {number}
            </span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
              <span
                style={{
                  fontSize: 19,
                  fontWeight: 500,
                  color: "var(--ink)",
                  letterSpacing: "-0.02em",
                  flex: 1,
                }}
              >
                {label}
              </span>
              {statusChip && <span style={{ flexShrink: 0 }}>{statusChip}</span>}
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.6, margin: 0 }}>
              {description}
            </p>
          </div>
        </div>
        {headerActions && <span style={{ flexShrink: 0, paddingTop: 28 }}>{headerActions}</span>}
      </div>

      <div style={{ paddingBottom: 56 }}>{children}</div>

      <hr className="rule" />
    </div>
  );
}

export function ProjectDrawer({
  open,
  onClose,
  projects,
  currentId,
  onSelect,
  onNew,
  onDelete,
  onRenameStart,
  onRenameSubmit,
  onRenameCancel,
  editingId,
  editName,
  onEditNameChange,
}: {
  open: boolean;
  onClose: () => void;
  projects: SavedProject[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRenameStart: (id: string, name: string) => void;
  onRenameSubmit: (id: string) => void;
  onRenameCancel: () => void;
  editingId: string | null;
  editName: string;
  onEditNameChange: (value: string) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(26, 26, 24, 0.2)",
              zIndex: 40,
            }}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: 320,
              height: "100vh",
              background: "var(--cream)",
              borderLeft: "1px solid var(--rule)",
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 20px 16px",
                borderBottom: "1px solid var(--rule)",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--ink-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Projects
              </span>
              <button className="btn-text" onClick={onClose} aria-label="Close projects">
                <X size={14} />
              </button>
            </div>

            <div style={{ padding: "12px 20px" }}>
              <button
                className="btn-text"
                onClick={onNew}
                style={{
                  fontSize: 12,
                  color: "var(--teal-deep)",
                  padding: "6px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Plus size={12} />
                New project
              </button>
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: "0 20px 20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {projects.map((project) => {
                  const isCurrent = project.id === currentId;
                  const isEditing = project.id === editingId;

                  return (
                    <div
                      key={project.id}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 6,
                        background: isCurrent ? "rgba(91, 138, 138, 0.07)" : "transparent",
                        border: `1px solid ${isCurrent ? "var(--teal)" : "transparent"}`,
                        cursor: isEditing ? "default" : "pointer",
                      }}
                      onClick={() => !isEditing && onSelect(project.id)}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(event) => onEditNameChange(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") onRenameSubmit(project.id);
                              if (event.key === "Escape") onRenameCancel();
                            }}
                            onBlur={() => onRenameSubmit(project.id)}
                            autoFocus
                            style={{
                              fontSize: 13,
                              fontFamily: "var(--font-display)",
                              color: "var(--ink)",
                              background: "transparent",
                              border: "1px solid var(--rule)",
                              borderRadius: 4,
                              padding: "3px 6px",
                              flex: 1,
                              outline: "none",
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: isCurrent ? 600 : 400,
                              color: "var(--ink)",
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {project.name}
                          </span>
                        )}

                        {!isEditing && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                            <button
                              className="btn-text"
                              onClick={(event) => {
                                event.stopPropagation();
                                onRenameStart(project.id, project.name);
                              }}
                              aria-label={`Rename ${project.name}`}
                              style={{ color: "var(--ink-muted)", padding: 2 }}
                            >
                              <PencilSimple size={11} />
                            </button>
                            <button
                              className="btn-text"
                              onClick={(event) => {
                                event.stopPropagation();
                                onDelete(project.id);
                              }}
                              aria-label={`Delete ${project.name}`}
                              style={{ color: "var(--ink-muted)", padding: 2 }}
                            >
                              <Trash size={11} />
                            </button>
                          </div>
                        )}
                      </div>

                      <span
                        className="mono"
                        style={{
                          fontSize: 9,
                          color: "var(--ink-muted)",
                          opacity: 0.6,
                          marginTop: 3,
                          display: "block",
                        }}
                      >
                        {new Date(project.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
