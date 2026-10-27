"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_VARIANT, liveTransport, REPLAYS, replayTransport, SAMPLE_TASKS, type SampleTask, type Variant } from "@keystone-ui/agent-core";
import { Badge, Button, SegmentedControl, Tooltip } from "@keystone-ui/ui";
import { ThemeToggle } from "./ThemeToggle";
import { AgentSession } from "./session/AgentSession";
import { VariantsDialog } from "./session/VariantsDialog";
import { StudyButton } from "./study/StudyDialogs";
import { StudyProvider } from "./study/StudyProvider";
import styles from "./session/session.module.css";

/** The app shell: pick a task, then watch and steer the agent on it. */
export function AgentApp({ fast }: { fast: boolean }) {
  return (
    <StudyProvider>
      <Shell fast={fast} />
    </StudyProvider>
  );
}

function Shell({ fast }: { fast: boolean }) {
  const [task, setTask] = useState<SampleTask | null>(null);
  const [variant, setVariant] = useState<Variant>(DEFAULT_VARIANT);
  const [run, setRun] = useState(0);
  const [mode, setMode] = useState<"replay" | "live">("replay");
  const [server, setServer] = useState<{ live: boolean; model?: string } | null>(null);

  // Ask the server whether live mode is set up (it needs an API key there, never here).
  useEffect(() => {
    fetch("/api/turn")
      .then((r) => (r.ok ? r.json() : { live: false }))
      .then(setServer, () => setServer({ live: false }));
  }, []);

  // A fresh transport per session: replays are stateful (they serve turns in order).
  const transport = useMemo(() => {
    if (!task) return null;
    if (mode === "live") return liveTransport();
    const script = REPLAYS[task.id];
    return script ? replayTransport(script, fast ? { chunkDelay: 0, firstDelay: 0 } : {}) : null;
    // `run` restarts the transport for a new session on the same task.
  }, [task, fast, run, mode]);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.title}>Keystone Agent</span>
          <Badge tone={mode === "live" ? "success" : "accent"}>{mode === "live" ? `Live · ${server?.model ?? "Claude"}` : "Replay"}</Badge>
        </div>
        <div className={styles.headerActions}>
          {!task && (
            <ModeSwitch mode={mode} live={server?.live ?? false} onChange={setMode} />
          )}
          {task && (
            <Button variant="ghost" size="sm" onClick={() => setTask(null)}>
              New task
            </Button>
          )}
          <StudyButton context={{ task: task?.id, variant }} />
          <VariantsDialog
            variant={variant}
            onApply={(next) => {
              setVariant(next);
              setRun((r) => r + 1);
            }}
          />
          <ThemeToggle />
        </div>
      </header>
      <main className={styles.main}>
        {task && transport ? (
          <AgentSession key={`${task.id}-${run}`} task={task} variant={variant} transport={transport} mode={mode} />
        ) : (
          <TaskPicker
            mode={mode}
            onPick={(t) => {
              setTask(t);
              setRun((r) => r + 1);
            }}
          />
        )}
      </main>
    </div>
  );
}

/** Replay or live. Live is offered only when the server has a key; the tooltip says why. */
function ModeSwitch({ mode, live, onChange }: { mode: "replay" | "live"; live: boolean; onChange: (m: "replay" | "live") => void }) {
  return (
    <Tooltip content={live ? "Live sessions call Claude and cost tokens." : "Live mode needs ANTHROPIC_API_KEY on the server."}>
      <SegmentedControl
        aria-label="Mode"
        size="sm"
        value={mode}
        onValueChange={onChange}
        options={[
          { value: "replay", label: "Replay" },
          { value: "live", label: "Live", disabled: !live },
        ]}
      />
    </Tooltip>
  );
}

function TaskPicker({ mode, onPick }: { mode: "replay" | "live"; onPick: (task: SampleTask) => void }) {
  return (
    <div className={styles.picker}>
      <h1 className={styles.pickerTitle}>What should the agent work on?</h1>
      <p className={styles.panelText}>
        {mode === "live"
          ? "It works on a small marketing site for a notes app, in a sandbox. Live sessions call Claude, so every run is different."
          : "It works on a small marketing site for a notes app, in a sandbox. Replays are recorded sessions: they run without an API key, and assume their edits get approved."}
      </p>
      <ul className={styles.tasks}>
        {SAMPLE_TASKS.map((task, i) => {
          const available = mode === "live" || Boolean(REPLAYS[task.id]);
          return (
            <li key={task.id} style={{ "--i": i } as React.CSSProperties}>
              <button type="button" className={styles.task} disabled={!available} onClick={() => onPick(task)}>
                <span className={styles.taskTitle}>{task.title}</span>
                <span className={styles.taskPrompt}>{task.prompt}</span>
                {!available && <Badge>Live mode only</Badge>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
