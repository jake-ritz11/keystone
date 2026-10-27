"use client";

import { useState } from "react";
import { appliedChanges, diffHunks, type Action, type SessionState } from "@keystone-ui/agent-core";
import { Badge, Button, DiffView, Textarea } from "@keystone-ui/ui";
import styles from "./session.module.css";

/** A check that draws itself in when its step completes; the ring around it is CSS. */
const CHECK = (
  <svg viewBox="0 0 16 16" className={styles.check}>
    <path d="M4 8.5l2.5 2.5 5.5-6" />
  </svg>
);
const SPOKEN = { done: "Done", in_progress: "In progress", pending: "To do" } as const;

/** The agent's plan as a checklist. In plan-first, it's also where the user approves it. */
export function PlanPanel({ state, dispatch }: { state: SessionState; dispatch: (a: Action) => void }) {
  const [feedback, setFeedback] = useState("");
  if (!state.plan) return null;
  const awaiting = !state.planApproved && state.status === "waiting";

  return (
    <section className={styles.plan} aria-labelledby="plan-heading" data-plan data-awaiting={awaiting || undefined}>
      <div className={styles.planHeader}>
        <h2 id="plan-heading" className={styles.panelTitle}>
          Plan
        </h2>
        {awaiting && <Badge tone="accent">Waiting for your approval</Badge>}
      </div>
      <ol className={styles.steps}>
        {state.plan.map((step, i) => (
          <li key={i} className={styles.step} data-status={step.status}>
            <span className={styles.stepMark} aria-hidden="true">
              {step.status === "done" && CHECK}
            </span>
            <span>
              <span className={styles.visuallyHidden}>{SPOKEN[step.status]}: </span>
              {step.title}
            </span>
          </li>
        ))}
      </ol>
      {awaiting && (
        <form
          className={styles.planApprove}
          onSubmit={(event) => {
            event.preventDefault();
            dispatch({ type: "approve_plan", feedback: feedback.trim() || undefined });
          }}
        >
          <Textarea
            label="Anything to change? (optional)"
            minRows={1}
            maxRows={4}
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            reserveMessageSpace={false}
          />
          <Button type="submit">Approve plan</Button>
        </form>
      )}
    </section>
  );
}

/** Approval "end": once the agent finishes, every change it made is reviewed here at once. */
export function ReviewPanel({ state, dispatch }: { state: SessionState; dispatch: (a: Action) => void }) {
  if (state.status !== "review") return null;
  const changes = appliedChanges(state).filter((i) => i.unreviewed);
  return (
    <section className={styles.review} aria-labelledby="review-heading">
      <h2 id="review-heading" className={styles.panelTitle}>
        Review {changes.length === 1 ? "1 change" : `${changes.length} changes`}
      </h2>
      <p className={styles.panelText}>The agent applied these while it worked. Undo any you don&apos;t want.</p>
      {changes.map((item) => (
        <DiffView
          key={item.id}
          path={item.change!.path}
          hunks={diffHunks(item.change!.before, item.change!.after)}
          actions={
            <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "undo", id: item.id })}>
              Undo
            </Button>
          }
        />
      ))}
      <div>
        <Button onClick={() => dispatch({ type: "review_done" })}>Keep the rest</Button>
      </div>
    </section>
  );
}

/** The message box. While the agent works, what you type is queued as a note for its next step. */
export function Composer({ state, dispatch, stop }: { state: SessionState; dispatch: (a: Action) => void; stop: () => void }) {
  const [text, setText] = useState("");
  const working = state.status === "streaming" || state.status === "ready";
  const waiting = state.status === "waiting";

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    dispatch(working || waiting ? { type: "note", text: value } : { type: "user_message", text: value });
    setText("");
  };

  const hint = working
    ? "The agent is working. Anything you send now reaches it with its next step."
    : waiting
      ? "Review the changes above, or add a note for the agent."
      : "Enter to send, Shift+Enter for a new line.";

  return (
    <form
      className={styles.composer}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Textarea
        label="Message the agent"
        hideLabel
        placeholder={working || waiting ? "Add a note…" : "Ask for a change…"}
        hint={hint}
        minRows={1}
        maxRows={6}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
          }
        }}
      />
      <div className={styles.composerActions}>
        {working || waiting ? (
          <Button variant="secondary" type="button" onClick={stop}>
            Stop
          </Button>
        ) : null}
        <Button type="submit" disabled={!text.trim()}>
          {working || waiting ? "Add note" : "Send"}
        </Button>
      </div>
    </form>
  );
}
