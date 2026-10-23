"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  createSession,
  reduce,
  streamTurn,
  systemPrompt,
  type Action,
  type SessionState,
  type Transport,
  type Variant,
  type Workspace,
} from "@keystone-ui/agent-core";

/**
 * Runs an agent session in the browser: the reducer holds the state, and whenever it says
 * "ready" this sends the next turn through the transport. The user's Stop aborts the stream.
 */
export function useSession(transport: Transport, workspace: Workspace, variant: Variant, firstMessage: string) {
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    reduce(createSession(workspace, variant), { type: "user_message", text: firstMessage }),
  );
  const controller = useRef<AbortController | null>(null);
  const sent = useRef<SessionState["messages"] | null>(null);

  useEffect(() => {
    // Exactly one turn per conversation state. Keyed to the messages array itself (it's
    // replaced on every change), not to whether a previous turn's cleanup has run yet: with a
    // fast transport the next "ready" can render before that. It also absorbs React's
    // development double-run of effects.
    if (state.status !== "ready" || sent.current === state.messages) return;
    sent.current = state.messages;
    const current = new AbortController();
    controller.current = current;
    void streamTurn(transport, { system: systemPrompt(state.variant), messages: state.messages }, dispatch, current.signal);
    // No cleanup: the status change this causes ("streaming") must not abort the turn.
  }, [state.status, state.messages, state.variant, transport]);

  // Leaving the page stops whatever is in flight. React's development mode unmounts and
  // remounts once on purpose; only abort if we're still unmounted a tick later.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      setTimeout(() => {
        if (!mounted.current) controller.current?.abort();
      }, 0);
    };
  }, []);

  const stop = useCallback(() => {
    controller.current?.abort(new DOMException("Stopped by the user", "AbortError"));
    controller.current = null;
    dispatch({ type: "interrupt" });
  }, []);

  const send = useCallback((action: Action) => dispatch(action), []);

  return { state, dispatch: send, stop } satisfies { state: SessionState; dispatch: (a: Action) => void; stop: () => void };
}
