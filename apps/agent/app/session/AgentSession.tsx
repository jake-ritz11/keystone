"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge, SegmentedControl, type CommandItem } from "@keystone-ui/ui";
import { paths, SAMPLE_SITE, studyEvent, type Action, type SampleTask, type SessionState, type StudyEvent, type Transport, type Variant } from "@keystone-ui/agent-core";
import type { Citation } from "./cite";
import { CiteContext } from "./RichText";
import { RatingCard } from "../study/RatingCard";
import { SessionLog } from "../study/SessionLog";
import { useStudy } from "../study/StudyProvider";
import { Composer, PlanPanel, ReviewPanel } from "./Panels";
import { Timeline } from "./Timeline";
import { useSession } from "./useSession";
import { WorkspacePane } from "./Workspace";
import styles from "./session.module.css";

const STATUS_TEXT: Partial<Record<string, string>> = {
  streaming: "Working…",
  ready: "Working…",
  waiting: "Waiting for you",
  review: "Done. Review the changes.",
  done: "Done",
  stopped: "Stopped",
  // The reason is in the timeline, so the status doesn't announce it a second time.
  error: "Stopped by an error",
};

export function AgentSession({
  task,
  variant,
  transport,
  mode,
  onCommands,
  onRestart,
}: {
  task: SampleTask;
  variant: Variant;
  transport: Transport;
  mode: "replay" | "live";
  /** Receives the commands that make sense in this session right now, for the command menu. */
  onCommands?: (items: CommandItem[]) => void;
  /** Starts the same task again; offered once the session has stopped. */
  onRestart?: () => void;
}) {
  const study = useStudy();
  // One study session per agent session, only when taking part. A ref, so React's development
  // double-mount doesn't open two.
  const studySession = useRef<string | null | undefined>(undefined);
  if (studySession.current === undefined) studySession.current = study.record ? study.startSession(task.id, mode, variant) : null;
  const log = useCallback(
    (event: Omit<StudyEvent, "t">) => {
      if (studySession.current) study.log(studySession.current, event);
    },
    [study],
  );
  const onAction = useCallback(
    (action: Action, before: SessionState) => {
      const event = studyEvent(action, before, 0);
      if (event) log({ kind: event.kind, data: event.data });
    },
    [log],
  );
  const { state, dispatch, stop } = useSession(transport, SAMPLE_SITE, variant, task.prompt, onAction);
  const [rated, setRated] = useState(false);
  // The file reference the user last followed from the conversation; seq makes a repeat count.
  const [citation, setCitation] = useState<{ cite: Citation; seq: number }>();
  // On a narrow screen one pane shows at a time; on a wide one this changes nothing.
  const [view, setView] = useState<"conversation" | "workspace">("conversation");
  const files = useMemo(() => new Set(paths(state.workspace)), [state.workspace]);
  const cites = useMemo(
    () => ({
      files,
      open: (cite: Citation) => {
        setCitation((c) => ({ cite, seq: (c?.seq ?? 0) + 1 }));
        setView("workspace");
      },
    }),
    [files],
  );
  const finished = state.status === "done" || state.status === "stopped" || state.status === "error";

  // Close the study session with how it ended.
  useEffect(() => {
    if (finished && studySession.current) study.endSession(studySession.current, state.status as "done" | "stopped" | "error");
  }, [finished, state.status, study]);
  const scroller = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  // Mirrors `pinned` for rendering: the pill shows only while the user has scrolled away.
  const [away, setAway] = useState(false);

  const jumpToLatest = () => {
    const el = scroller.current;
    if (!el) return;
    pinned.current = true;
    setAway(false);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
    // The pill is about to go; put focus where the next move is, not on <body>.
    el.closest("section")?.querySelector<HTMLTextAreaElement>("textarea")?.focus({ preventScroll: true });
  };

  // The plan is sticky. Tell the scroller its height, so focusing or scrolling to anything
  // keeps it below the plan instead of hidden behind it (WCAG 2.4.11, focus not obscured).
  useEffect(() => {
    const el = scroller.current;
    const plan = el?.querySelector<HTMLElement>("[data-plan]");
    if (!el || !plan) return;
    const observer = new ResizeObserver(([entry]) => {
      el.style.setProperty("--plan-height", `${Math.ceil(entry?.borderBoxSize[0]?.blockSize ?? plan.offsetHeight)}px`);
    });
    observer.observe(plan);
    return () => observer.disconnect();
  }, [state.plan !== null]);

  // Follow the conversation as it grows, unless the user has scrolled up to read.
  useEffect(() => {
    const el = scroller.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [state.items]);

  const working = state.status === "streaming" || state.status === "ready" || state.status === "waiting";
  const pending = state.items.find((item) => item.type === "tool" && item.status === "awaiting");
  useEffect(() => {
    const items: CommandItem[] = [];
    if (pending) {
      items.push({
        id: "approve",
        group: "Session",
        label: `Approve the edit to ${pending.type === "tool" ? (pending.change?.path ?? "the file") : "the file"}`,
        keywords: ["accept", "apply", "yes"],
        onSelect: () => dispatch({ type: "approve", id: pending.id }),
      });
    }
    if (working) items.push({ id: "stop", group: "Session", label: "Stop the agent", keywords: ["cancel", "halt"], onSelect: stop });
    if (away) items.push({ id: "jump", group: "Session", label: "Jump to latest", keywords: ["scroll", "bottom", "end"], onSelect: jumpToLatest });
    onCommands?.(items);
    // jumpToLatest only reads refs, so a stale copy behaves the same.
  }, [pending?.id, working, away, dispatch, stop, onCommands]);
  useEffect(() => () => onCommands?.([]), [onCommands]);

  return (
    <SessionLog.Provider value={log}>
      <div className={styles.session} data-view={view}>
        <div className={styles.viewSwitch}>
          <SegmentedControl
            aria-label="View"
            size="sm"
            value={view}
            onValueChange={setView}
            options={[
              {
                value: "conversation",
                label: (
                  <>
                    Conversation
                    {/* So an approval waiting in the other pane isn't missed. */}
                    {view === "workspace" && state.status === "waiting" && (
                      <Badge tone="accent" className={styles.viewBadge}>
                        Waiting
                      </Badge>
                    )}
                  </>
                ),
              },
              { value: "workspace", label: "Workspace" },
            ]}
          />
        </div>
        <section className={styles.conversation} aria-label="Agent">
          <div
            ref={scroller}
            className={styles.scroller}
            onScroll={(event) => {
              const el = event.currentTarget;
              pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
              if (away === pinned.current) setAway(!pinned.current);
            }}
          >
            <PlanPanel state={state} dispatch={dispatch} />
            <CiteContext.Provider value={cites}>
              <Timeline state={state} dispatch={dispatch} />
            </CiteContext.Provider>
            <ReviewPanel state={state} dispatch={dispatch} />
            {studySession.current && state.status === "done" && !rated && (
              <RatingCard
                onSubmit={(rating) => {
                  study.rate(studySession.current!, rating);
                  setRated(true);
                }}
                onSkip={() => setRated(true)}
              />
            )}
          </div>
          {away && (
            <button type="button" className={styles.jump} onClick={jumpToLatest}>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" />
              </svg>
              Jump to latest
            </button>
          )}
          <div className={styles.footer}>
            <div className={styles.statusRow}>
              <p className={styles.status} role="status" data-status={state.status}>
                {STATUS_TEXT[state.status] ?? ""}
              </p>
              {/* An error or a stop says what to do next, here and not only in the command menu. */}
              {(state.status === "error" || state.status === "stopped") && onRestart && (
                <button type="button" className={styles.restart} onClick={onRestart}>
                  Restart this task
                </button>
              )}
            </div>
            <Composer state={state} dispatch={dispatch} stop={stop} />
          </div>
        </section>
        <section className={styles.side} aria-label="Workspace">
          <WorkspacePane workspace={state.workspace} baseline={state.baseline} citation={citation} />
        </section>
      </div>
    </SessionLog.Provider>
  );
}
