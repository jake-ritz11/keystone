import { test } from "node:test";
import assert from "node:assert/strict";
import type Anthropic from "@anthropic-ai/sdk";
import { decodeEvents, encodeEvent, translate } from "./live.ts";
import type { StreamEvent } from "./session.ts";

type SdkEvent = Anthropic.Beta.Messages.BetaRawMessageStreamEvent;
const sdk = (event: unknown) => event as SdkEvent;

test("SDK stream events translate to session events; bookkeeping is dropped", () => {
  assert.deepEqual(translate(sdk({ type: "content_block_start", index: 0, content_block: { type: "thinking", thinking: "", signature: "" } })), {
    type: "block_start",
    index: 0,
    block: "thinking",
  });
  assert.deepEqual(translate(sdk({ type: "content_block_start", index: 1, content_block: { type: "tool_use", id: "toolu_1", name: "edit_file", input: {} } })), {
    type: "block_start",
    index: 1,
    block: { tool: "edit_file", id: "toolu_1" },
  });
  assert.deepEqual(translate(sdk({ type: "content_block_delta", index: 1, delta: { type: "input_json_delta", partial_json: '{"pa' } })), {
    type: "input_delta",
    index: 1,
    json: '{"pa',
  });
  assert.deepEqual(translate(sdk({ type: "content_block_delta", index: 0, delta: { type: "thinking_delta", thinking: "Reading styles.css" } })), {
    type: "thinking_delta",
    index: 0,
    text: "Reading styles.css",
  });
  assert.equal(translate(sdk({ type: "content_block_delta", index: 0, delta: { type: "signature_delta", signature: "x" } })), null);
  assert.equal(translate(sdk({ type: "content_block_start", index: 2, content_block: { type: "fallback", from: {}, to: {} } })), null);
  assert.equal(translate(sdk({ type: "message_start", message: {} })), null);
});

/** A body that delivers the given text in awkward chunks, splitting lines and characters. */
function chunked(text: string, size: number): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  let offset = 0;
  return new ReadableStream({
    pull(controller) {
      if (offset >= bytes.length) return controller.close();
      controller.enqueue(bytes.slice(offset, offset + size));
      offset += size;
    },
  });
}

test("events survive the trip through SSE, however the bytes are chunked", async () => {
  const events: StreamEvent[] = [
    { type: "block_start", index: 0, block: "text" },
    { type: "text_delta", index: 0, text: "Fixed the “About” link — and nothing else.\n\nDone." },
    { type: "turn_error", message: "Rate limited" },
  ];
  const wire = events.map(encodeEvent).join("");
  for (const size of [1, 3, 7, 64, wire.length]) {
    const out: StreamEvent[] = [];
    for await (const event of decodeEvents(chunked(wire, size))) out.push(event);
    assert.deepEqual(out, events, `chunk size ${size}`);
  }
});
