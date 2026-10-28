import { encodeEvent, type StreamEvent } from "@keystone-ui/agent-core";

/** A turn the way the route streams it: block starts, deltas, then the final message. */
export function turn(blocks: ({ text: string } | { thinking: string } | { tool: string; id: string; input: object })[], stop: "tool_use" | "end_turn"): string {
  const events: StreamEvent[] = [];
  const content: unknown[] = [];
  blocks.forEach((b, index) => {
    if ("text" in b) {
      events.push({ type: "block_start", index, block: "text" }, { type: "text_delta", index, text: b.text });
      content.push({ type: "text", text: b.text });
    } else if ("thinking" in b) {
      events.push({ type: "block_start", index, block: "thinking" }, { type: "thinking_delta", index, text: b.thinking });
      content.push({ type: "thinking", thinking: b.thinking, signature: "sig" });
    } else {
      const json = JSON.stringify(b.input);
      events.push({ type: "block_start", index, block: { tool: b.tool, id: b.id } }, { type: "input_delta", index, json: json.slice(0, 10) }, { type: "input_delta", index, json: json.slice(10) });
      content.push({ type: "tool_use", id: b.id, name: b.tool, input: b.input });
    }
  });
  events.push({ type: "turn_end", message: { content, stop_reason: stop, usage: { input_tokens: 100, output_tokens: 50 } } as never });
  return events.map(encodeEvent).join("");
}
