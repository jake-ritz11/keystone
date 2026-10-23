"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { participantId, type Rating, type StudyEvent, type StudyRecord, type StudySession, type Suggestion, type Variant } from "@keystone-ui/agent-core";

const KEY = "keystone-study";

function load(): StudyRecord | null {
  try {
    const raw = localStorage.getItem(KEY);
    const record = raw ? (JSON.parse(raw) as StudyRecord) : null;
    return record?.version === 1 ? record : null;
  } catch {
    return null;
  }
}

function save(record: StudyRecord | null) {
  try {
    if (record) localStorage.setItem(KEY, JSON.stringify(record));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage can be blocked. The study then lasts for this visit, and the download still works.
  }
}

interface StudyApi {
  /** Null until the participant consents. Nothing is recorded before that. */
  record: StudyRecord | null;
  join: () => void;
  /** Leaves the study and deletes everything recorded in this browser. */
  leave: () => void;
  startSession: (task: string, mode: "replay" | "live", variant: Variant) => string | null;
  log: (session: string, event: Omit<StudyEvent, "t">) => void;
  endSession: (session: string, outcome: NonNullable<StudySession["outcome"]>) => void;
  rate: (session: string, rating: Rating) => void;
  suggest: (suggestion: Omit<Suggestion, "at">) => void;
  download: () => void;
}

const StudyContext = createContext<StudyApi | null>(null);

export function useStudy(): StudyApi {
  const api = useContext(StudyContext);
  if (!api) throw new Error("useStudy() must be used inside <StudyProvider>.");
  return api;
}

/**
 * The study's record, held in this browser only, and only after consent. Participants can
 * download it at any time, and leaving deletes it.
 */
export function StudyProvider({ children }: { children: ReactNode }) {
  const [record, setRecord] = useState<StudyRecord | null>(null);
  const starts = useRef(new Map<string, number>());

  useEffect(() => setRecord(load()), []);

  const update = useCallback((change: (r: StudyRecord) => StudyRecord) => {
    setRecord((current) => {
      if (!current) return current;
      const next = change(current);
      save(next);
      return next;
    });
  }, []);

  const api = useMemo<StudyApi>(
    () => ({
      record,
      join: () => {
        const next: StudyRecord = { version: 1, participant: participantId(), consentedAt: new Date().toISOString(), sessions: [], suggestions: [] };
        save(next);
        setRecord(next);
      },
      leave: () => {
        save(null);
        setRecord(null);
      },
      startSession: (task, mode, variant) => {
        if (!record) return null;
        const id = `s-${Date.now().toString(36)}`;
        starts.current.set(id, performance.now());
        update((r) => ({ ...r, sessions: [...r.sessions, { id, task, mode, variant, startedAt: new Date().toISOString(), events: [] }] }));
        return id;
      },
      log: (session, event) => {
        const start = starts.current.get(session);
        if (start === undefined) return;
        const t = Math.round(performance.now() - start);
        update((r) => ({ ...r, sessions: r.sessions.map((s) => (s.id === session ? { ...s, events: [...s.events, { ...event, t }] } : s)) }));
      },
      endSession: (session, outcome) =>
        update((r) => ({
          ...r,
          sessions: r.sessions.map((s) => (s.id === session && !s.endedAt ? { ...s, endedAt: new Date().toISOString(), outcome } : s)),
        })),
      rate: (session, rating) => update((r) => ({ ...r, sessions: r.sessions.map((s) => (s.id === session ? { ...s, rating } : s)) })),
      suggest: (suggestion) => update((r) => ({ ...r, suggestions: [...r.suggestions, { ...suggestion, at: new Date().toISOString() }] })),
      download: () => {
        if (!record) return;
        const blob = new Blob([JSON.stringify(record, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `keystone-study-${record.participant}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
    }),
    [record, update],
  );

  return <StudyContext.Provider value={api}>{children}</StudyContext.Provider>;
}
