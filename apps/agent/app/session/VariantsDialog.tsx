"use client";

import { useState } from "react";
import type { Approval, Planning, Variant, Visibility } from "@keystone-ui/agent-core";
import { Button, Dialog, Select } from "@keystone-ui/ui";
import styles from "./session.module.css";

const PLANNING: [Planning, string, string][] = [
  ["act", "Act at once", "The agent starts working; its plan is a live checklist."],
  ["plan-first", "Plan first", "Nothing changes until you approve the agent's plan."],
];
const VISIBILITY: [Visibility, string, string][] = [
  ["timeline", "Timeline", "Every tool call as a row you can expand."],
  ["narrative", "Narrative", "Reads are folded into one line; edits are shown in full."],
  ["outcomes", "Outcomes only", "Just the edits and what the agent says."],
];
const APPROVAL: [Approval, string, string][] = [
  ["each", "Approve each edit", "Every edit waits for you before it's applied."],
  ["end", "Review at the end", "Edits apply as the agent works; you review them all when it's done."],
  ["auto", "Apply automatically", "Edits apply at once, and each can be undone."],
];

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string, string][]; onChange: (v: T) => void }) {
  const hint = options.find(([v]) => v === value)?.[2];
  return (
    <Select label={label} value={value} hint={hint} onChange={(e) => onChange(e.target.value as T)}>
      {options.map(([v, text]) => (
        <option key={v} value={v}>
          {text}
        </option>
      ))}
    </Select>
  );
}

/** The three study dimensions. Changes apply to the next session, so a run is never mixed. */
export function VariantsDialog({ variant, onApply }: { variant: Variant; onApply: (v: Variant) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(variant);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setDraft(variant);
          setOpen(true);
        }}
      >
        Variants
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Interaction variants"
        description="Each one is a different answer to a question about working with an agent. Changing them starts a new session."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onApply(draft);
                setOpen(false);
              }}
            >
              Start new session
            </Button>
          </>
        }
      >
        <div className={styles.variantFields}>
          <p className={styles.panelText}>
            Why these three, and what the study will measure:{" "}
            {/* A new tab, so following it doesn't throw away the session in progress. */}
            <a href="https://github.com/jake-ritz11/keystone/blob/main/docs/variants.md" target="_blank" rel="noopener noreferrer">
              the reasoning behind each variant<span className={styles.visuallyHidden}> (opens in a new tab)</span>
            </a>
            .
          </p>
          <Choice label="Planning" value={draft.planning} options={PLANNING} onChange={(planning) => setDraft({ ...draft, planning })} />
          <Choice label="Tool calls" value={draft.visibility} options={VISIBILITY} onChange={(visibility) => setDraft({ ...draft, visibility })} />
          <Choice label="Approval" value={draft.approval} options={APPROVAL} onChange={(approval) => setDraft({ ...draft, approval })} />
        </div>
      </Dialog>
    </>
  );
}
