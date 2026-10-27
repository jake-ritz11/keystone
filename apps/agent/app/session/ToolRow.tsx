"use client";

import { useState } from "react";
import { diffHunks, type Action, type Approval, type ToolItem } from "@keystone-ui/agent-core";
import { Badge, Button, DiffView, Disclosure, Input, Shimmer } from "@keystone-ui/ui";
import { useSessionLog } from "../study/SessionLog";
import { describeTool, isWrite, STATUS, toolPath } from "./describe";
import styles from "./session.module.css";

/** One tool call. Reads expand to show their output; writes show their diff and decision. */
export function ToolRow({ item, approval, dispatch }: { item: ToolItem; approval: Approval; dispatch: (a: Action) => void }) {
  const log = useSessionLog();
  const status = STATUS[item.status];
  const badge = status && !(item.status === "applied" && approval === "auto") && (
    <Badge tone={status.tone} dot pulse={item.status === "streaming"}>
      {status.label}
    </Badge>
  );

  if (isWrite(item)) return <WriteRow item={item} badge={badge} dispatch={dispatch} />;

  return (
    <Disclosure summary={<Shimmer active={item.status === "streaming"}>{describeTool(item)}</Shimmer>} meta={badge || undefined} onOpenChange={(open) => open && log({ kind: "expand", data: { tool: item.name } })}>
      <pre className={styles.toolOutput} tabIndex={0} aria-label={`Output of: ${describeTool(item)}`}>
        {item.output ?? item.error ?? "…"}
      </pre>
    </Disclosure>
  );
}

function WriteRow({ item, badge, dispatch }: { item: ToolItem; badge: React.ReactNode; dispatch: (a: Action) => void }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  if (item.status === "streaming" || !item.change) {
    return (
      <div className={styles.tool} data-status={item.status}>
        <div className={styles.toolSummary}>
          <Shimmer className={styles.toolTitle} active={item.status === "streaming"}>
            {describeTool(item)}
          </Shimmer>
          {badge}
        </div>
        {item.error && <p className={styles.toolError}>{item.error}</p>}
      </div>
    );
  }

  const actions =
    item.status === "awaiting" ? (
      rejecting ? null : (
        <>
          <Button size="sm" variant="secondary" onClick={() => setRejecting(true)}>
            Reject
          </Button>
          <Button size="sm" onClick={() => dispatch({ type: "approve", id: item.id })}>
            Approve
          </Button>
        </>
      )
    ) : (
      <>
        {item.unreviewed && <Badge tone="accent">Unreviewed</Badge>}
        {badge}
        {item.status === "applied" && (
          <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "undo", id: item.id })}>
            Undo
          </Button>
        )}
      </>
    );

  return (
    <div className={styles.write} data-status={item.status}>
      <DiffView path={toolPath(item) ?? item.change.path} hunks={diffHunks(item.change.before, item.change.after)} actions={actions} />
      {rejecting && (
        <form
          className={styles.reject}
          onSubmit={(event) => {
            event.preventDefault();
            dispatch({ type: "reject", id: item.id, reason: reason.trim() || undefined });
          }}
        >
          <Input
            label="Why? (optional)"
            placeholder="So the agent can adjust"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            reserveMessageSpace={false}
            autoFocus
          />
          <div className={styles.rejectActions}>
            <Button size="sm" variant="ghost" type="button" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" type="submit">
              Reject edit
            </Button>
          </div>
        </form>
      )}
      {item.note && <p className={styles.toolNote}>Your reason: {item.note}</p>}
    </div>
  );
}
