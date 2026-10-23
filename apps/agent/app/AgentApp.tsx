"use client";

import { useMemo, useState } from "react";
import { DEFAULT_VARIANT, REPLAYS, replayTransport, SAMPLE_TASKS, type SampleTask, type Variant } from "@keystone-ui/agent-core";
import { Badge, Button } from "@keystone-ui/ui";
import { ThemeToggle } from "./ThemeToggle";
import { AgentSession } from "./session/AgentSession";
import { VariantsDialog } from "./session/VariantsDialog";
import styles from "./session/session.module.css";

/** The app shell: pick a task, then watch and steer the agent on it. */
export function AgentApp({ fast }: { fast: boolean }) {
  const [task, setTask] = useState<SampleTask | null>(null);
  const [variant, setVariant] = useState<Variant>(DEFAULT_VARIANT);
  const [run, setRun] = useState(0);

  // A fresh replay per session: replays are stateful (they serve turns in order).
  const transport = useMemo(
    () => (task && REPLAYS[task.id] ? replayTransport(REPLAYS[task.id]!, fast ? { chunkDelay: 0, firstDelay: 0 } : {}) : null),
    // `run` restarts the replay for a new session on the same task.
    [task, fast, run],
  );

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.title}>Keystone Agent</span>
          <Badge tone="accent">Replay</Badge>
        </div>
        <div className={styles.headerActions}>
          {task && (
            <Button variant="ghost" size="sm" onClick={() => setTask(null)}>
              New task
            </Button>
          )}
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
          <AgentSession key={`${task.id}-${run}`} task={task} variant={variant} transport={transport} />
        ) : (
          <TaskPicker
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

function TaskPicker({ onPick }: { onPick: (task: SampleTask) => void }) {
  return (
    <div className={styles.picker}>
      <h1 className={styles.pickerTitle}>What should the agent work on?</h1>
      <p className={styles.panelText}>
        It works on a small marketing site for a notes app, in a sandbox. These sessions are recorded replays, so they
        run without an API key; live mode comes next.
      </p>
      <ul className={styles.tasks}>
        {SAMPLE_TASKS.map((task) => {
          const available = Boolean(REPLAYS[task.id]);
          return (
            <li key={task.id}>
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
