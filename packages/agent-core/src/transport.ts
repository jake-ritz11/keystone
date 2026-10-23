/**
 * A transport turns one request (the conversation so far) into a stream of normalized events
 * for the reducer. The live transport calls the server route; the replay transport plays a
 * scripted session with the same chunking and timing a real stream has.
 */
import type Anthropic from "@anthropic-ai/sdk";
import type { Action, StreamEvent, Variant } from "./session.ts";

export interface TurnRequest {
  system: string;
  messages: Anthropic.MessageParam[];
  variant: Variant;
}

export type Transport = (request: TurnRequest, signal: AbortSignal) => AsyncIterable<StreamEvent>;

/** One scripted model turn, written as finished blocks. */
export interface ScriptedTurn {
  blocks: (
    | { text: string }
    | { thinking: string }
    | { tool: string; input: Record<string, unknown> }
  )[];
  stop: "tool_use" | "end_turn";
}

export interface ReplayOptions {
  /** Milliseconds per streamed chunk. 0 for tests. */
  chunkDelay?: number;
  /** Pause before the first block, like a model thinking before it starts writing. */
  firstDelay?: number;
}

export class ReplayFinished extends Error {}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.reject(signal.reason);
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

function chunks(text: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out.length ? out : [""];
}

/**
 * Plays a scripted session one turn per request. It doesn't branch on the user's choices:
 * the script assumes its edits are approved. It's for demos, reviewers without an API key,
 * and the behavior tests, never for the study.
 */
export function replayTransport(script: ScriptedTurn[], options: ReplayOptions = {}): Transport {
  const { chunkDelay = 18, firstDelay = 500 } = options;
  let index = 0;
  let ids = 0;

  return async function* replay(_request, signal) {
    const turn = script[index++];
    if (!turn) throw new ReplayFinished("This replay has no more turns. Start a new session to watch it again.");
    await sleep(firstDelay, signal);

    const content: Anthropic.ContentBlock[] = [];
    for (const [i, block] of turn.blocks.entries()) {
      if ("text" in block) {
        yield { type: "block_start", index: i, block: "text" };
        for (const piece of chunks(block.text, 6)) {
          await sleep(chunkDelay, signal);
          yield { type: "text_delta", index: i, text: piece };
        }
        content.push({ type: "text", text: block.text, citations: null } as Anthropic.TextBlock);
      } else if ("thinking" in block) {
        yield { type: "block_start", index: i, block: "thinking" };
        await sleep(chunkDelay * 8, signal);
        yield { type: "thinking_delta", index: i, text: block.thinking };
        content.push({ type: "thinking", thinking: block.thinking, signature: "" } as Anthropic.ThinkingBlock);
      } else {
        const id = `toolu_replay_${String(++ids).padStart(3, "0")}`;
        yield { type: "block_start", index: i, block: { tool: block.tool, id } };
        for (const piece of chunks(JSON.stringify(block.input), 24)) {
          await sleep(chunkDelay, signal);
          yield { type: "input_delta", index: i, json: piece };
        }
        content.push({ type: "tool_use", id, name: block.tool, input: block.input } as Anthropic.ToolUseBlock);
      }
    }
    yield {
      type: "turn_end",
      message: { content, stop_reason: turn.stop, usage: { input_tokens: 0, output_tokens: 0 } as Anthropic.Usage },
    };
  };
}

/**
 * Streams one turn into the session through `dispatch`. Aborting (the user's Stop button) is
 * not an error: the caller dispatches `interrupt` itself.
 */
export async function streamTurn(
  transport: Transport,
  request: TurnRequest,
  dispatch: (action: Action) => void,
  signal: AbortSignal,
): Promise<void> {
  dispatch({ type: "turn_start" });
  try {
    for await (const event of transport(request, signal)) {
      if (signal.aborted) return;
      dispatch({ type: "stream", event });
    }
  } catch (error) {
    if (signal.aborted) return;
    const message = error instanceof Error ? error.message : "The turn failed.";
    dispatch({ type: "stream", event: { type: "turn_error", message } });
  }
}
