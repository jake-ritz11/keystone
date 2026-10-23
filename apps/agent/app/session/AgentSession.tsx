"use client";

import { useEffect, useRef } from "react";
import { SAMPLE_SITE, type SampleTask, type Transport, type Variant } from "@keystone-ui/agent-core";
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
  error: "Something went wrong",
};

export function AgentSession({ task, variant, transport }: { task: SampleTask; variant: Variant; transport: Transport }) {
  const { state, dispatch, stop } = useSession(transport, SAMPLE_SITE, variant, task.prompt);
  const scroller = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

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

  return (
    <div className={styles.session}>
      <section className={styles.conversation} aria-label="Agent">
        <div
          ref={scroller}
          className={styles.scroller}
          onScroll={(event) => {
            const el = event.currentTarget;
            pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
          }}
        >
          <PlanPanel state={state} dispatch={dispatch} />
          <Timeline state={state} dispatch={dispatch} />
          <ReviewPanel state={state} dispatch={dispatch} />
        </div>
        <div className={styles.footer}>
          <p className={styles.status} role="status" data-status={state.status}>
            {STATUS_TEXT[state.status] ?? ""}
          </p>
          <Composer state={state} dispatch={dispatch} stop={stop} />
        </div>
      </section>
      <section className={styles.side} aria-label="Workspace">
        <WorkspacePane workspace={state.workspace} baseline={state.baseline} />
      </section>
    </div>
  );
}
