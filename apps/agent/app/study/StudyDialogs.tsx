"use client";

import { useState } from "react";
import { summarizeSession, type Variant } from "@keystone-ui/agent-core";
import { Badge, Button, Dialog, Textarea, useToast } from "@keystone-ui/ui";
import { useStudy } from "./StudyProvider";
import styles from "./study.module.css";

/** The header's study control: an invitation before consent, the participant's panel after. */
export function StudyButton({ context }: { context: { task?: string; variant: Variant } }) {
  const study = useStudy();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        {study.record ? "Study" : "Take part"}
        {study.record && <Badge tone="success" dot>On</Badge>}
      </Button>
      {study.record ? <StudyPanel open={open} onOpenChange={setOpen} context={context} /> : <Consent open={open} onOpenChange={setOpen} />}
    </>
  );
}

function Consent({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const study = useStudy();
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Take part in the study"
      description="A short study of how people prefer to work with a coding agent. Taking part is voluntary."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button
            onClick={() => {
              study.join();
              onOpenChange(false);
            }}
          >
            I agree, take part
          </Button>
        </>
      }
    >
      <div className={styles.consent}>
        <section>
          <h3 className={styles.heading}>What&apos;s recorded</h3>
          <ul className={styles.list}>
            <li>Which task and interaction variant each session used.</li>
            <li>What you did and when: approvals, rejections, undos, stops, notes, and which details you opened.</li>
            <li>The lengths of anything you type to the agent, but not the words.</li>
            <li>Your answers to three short questions after each task, and any suggestion you choose to write.</li>
          </ul>
        </section>
        <section>
          <h3 className={styles.heading}>What isn&apos;t</h3>
          <ul className={styles.list}>
            <li>Your name, email, IP address, or anything about your device.</li>
            <li>What you type to the agent. Only a suggestion you write for the study is kept as text.</li>
          </ul>
        </section>
        <section>
          <h3 className={styles.heading}>Where it goes</h3>
          <p className={styles.text}>
            It stays in this browser, under a random participant ID. Nothing is sent anywhere. When you&apos;re done, you
            download it and send the file yourself. You can download or delete it, and leave, at any time from the
            Study button.
          </p>
        </section>
      </div>
    </Dialog>
  );
}

function StudyPanel({ open, onOpenChange, context }: { open: boolean; onOpenChange: (open: boolean) => void; context: { task?: string; variant: Variant } }) {
  const study = useStudy();
  const { toast } = useToast();
  const [suggestion, setSuggestion] = useState("");
  const [confirming, setConfirming] = useState(false);
  const record = study.record;
  if (!record) return null;
  const rated = record.sessions.filter((s) => s.rating).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setConfirming(false);
        onOpenChange(next);
      }}
      title="The study"
      description={`You're participant ${record.participant}.`}
      footer={
        confirming ? (
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Keep my data
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                study.leave();
                onOpenChange(false);
                toast({ title: "You've left the study", description: "Everything it recorded in this browser is deleted." });
              }}
            >
              Delete and leave
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setConfirming(true)}>
              Leave the study…
            </Button>
            <Button onClick={study.download}>Download my data</Button>
          </>
        )
      }
    >
      <div className={styles.consent}>
        {confirming && (
          <p className={styles.warning} role="alert">
            This deletes everything the study recorded in this browser. Download it first if you&apos;d like to send it.
          </p>
        )}
        <p className={styles.text}>
          {record.sessions.length === 0
            ? "No sessions recorded yet. Pick a task to start."
            : `${record.sessions.length} session${record.sessions.length === 1 ? "" : "s"} recorded, ${rated} rated, ${record.suggestions.length} suggestion${record.suggestions.length === 1 ? "" : "s"}.`}
        </p>
        {record.sessions.length > 0 && (
          <ul className={styles.sessions}>
            {record.sessions.slice(-5).map((s) => {
              const sum = summarizeSession(s);
              return (
                <li key={s.id}>
                  <span className={styles.sessionTask}>{s.task}</span>{" "}
                  <span className={styles.text}>
                    {Math.round(sum.durationMs / 1000)}s, {sum.approved} approved, {sum.rejected} rejected, {sum.undone} undone
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <form
          className={styles.suggest}
          onSubmit={(event) => {
            event.preventDefault();
            if (!suggestion.trim()) return;
            study.suggest({ text: suggestion.trim(), task: context.task, variant: context.variant });
            setSuggestion("");
            toast({ title: "Thanks, suggestion saved", tone: "success" });
          }}
        >
          <Textarea
            label="Suggest a change"
            hint="Anything about how the agent or the app works. This is kept as text."
            minRows={2}
            maxRows={6}
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
          />
          <div>
            <Button type="submit" variant="secondary" disabled={!suggestion.trim()}>
              Save suggestion
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
