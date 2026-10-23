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
export function useSession(
  transport: Transport,
  workspace: Workspace,
  variant: Variant,
  firstMessage: string,
  /** Sees every action with the exact state it's applied to, e.g. for study logging. */
  onAction?: (action: Action, before: SessionState) => void,
) {
  const [state, rawDispatch] = useReducer(reduce, undefined, () =>
    reduce(createSession(workspace, variant), { type: "user_message", text: firstMessage }),
  );
  // A shadow of the state, advanced on every dispatch: many actions arrive between renders while
  // a turn streams, and each needs the state it was really applied to.
  const shadow = useRef(state);
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;
  const dispatch = useCallback((action: Action) => {
    onActionRef.current?.(action, shadow.current);
    shadow.current = reduce(shadow.current, action);
    rawDispatch(action);
  }, []);
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
    void streamTurn(transport, { system: systemPrompt(state.variant), messages: state.messages, variant: state.variant }, dispatch, current.signal);
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
  }, [dispatch]);

  return { state, dispatch, stop } satisfies { state: SessionState; dispatch: (a: Action) => void; stop: () => void };
}
