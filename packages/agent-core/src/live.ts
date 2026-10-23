/**
 * Live mode's wire format. The server route turns the SDK's stream into the session's
 * StreamEvents and sends them as server-sent events; the live transport reads them back.
 * Kept here, pure and shared, so both ends are tested against each other.
 */
import type Anthropic from "@anthropic-ai/sdk";
import type { StreamEvent, Variant } from "./session.ts";
import type { Transport } from "./transport.ts";

type SdkEvent = Anthropic.Beta.Messages.BetaRawMessageStreamEvent;

/**
 * One SDK stream event to the session's event, or null for events the UI doesn't draw
 * (signatures, citations, message bookkeeping). The final message, with everything, still
 * reaches the session as `turn_end`, so nothing is lost from the conversation history.
 */
export function translate(event: SdkEvent): StreamEvent | null {
  if (event.type === "content_block_start") {
    const block = event.content_block;
    if (block.type === "text") return { type: "block_start", index: event.index, block: "text" };
    if (block.type === "thinking") return { type: "block_start", index: event.index, block: "thinking" };
    if (block.type === "tool_use") return { type: "block_start", index: event.index, block: { tool: block.name, id: block.id } };
    return null;
  }
  if (event.type === "content_block_delta") {
    const delta = event.delta;
    if (delta.type === "text_delta") return { type: "text_delta", index: event.index, text: delta.text };
    if (delta.type === "thinking_delta") return { type: "thinking_delta", index: event.index, text: delta.thinking };
    if (delta.type === "input_json_delta") return { type: "input_delta", index: event.index, json: delta.partial_json };
    return null;
  }
  return null;
}

export function encodeEvent(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/** Reads server-sent events back into StreamEvents, however the bytes were chunked. */
export async function* decodeEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<StreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      // stream: true keeps a multi-byte character split across chunks intact.
      buffer += decoder.decode(value, { stream: true });
      let end: number;
      while ((end = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const data = frame
          .split("\n")
          .filter((line) => line.startsWith("data: "))
          .map((line) => line.slice(6))
          .join("\n");
        if (data) yield JSON.parse(data) as StreamEvent;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/** What the client sends: the conversation and the variant. The server owns the prompt and tools. */
export interface TurnBody {
  variant: Variant;
  messages: Anthropic.MessageParam[];
}

/** Calls the live route. Errors the route reports arrive as `turn_error` events. */
export function liveTransport(url = "/api/turn"): Transport {
  return async function* live(request, signal) {
    const body: TurnBody = { variant: request.variant, messages: request.messages };
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    if (!response.ok || !response.body) {
      let message = `The agent couldn't start (HTTP ${response.status}).`;
      try {
        const json = (await response.json()) as { error?: string };
        if (json.error) message = json.error;
      } catch {
        // Not JSON: keep the generic message.
      }
      yield { type: "turn_error", message };
      return;
    }
    yield* decodeEvents(response.body);
  };
}
