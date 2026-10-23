/**
 * Live mode: one streamed model turn per request. The client sends only the conversation and
 * the variant; the system prompt and tools are built here, so this endpoint can't be used as a
 * general-purpose proxy to Claude. Tools run in the browser, so nothing the model asks for runs
 * on this server.
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiTools, encodeEvent, systemPrompt, translate, type StreamEvent } from "@keystone-ui/agent-core";

export const runtime = "nodejs";

const MODEL = process.env.AGENT_MODEL ?? "claude-opus-5-5";
const EFFORT = (process.env.AGENT_EFFORT ?? "medium") as "low" | "medium" | "high";
const MAX_TOKENS = 16_000;
const DAILY_TOKENS = Number(process.env.AGENT_DAILY_TOKEN_BUDGET ?? 3_000_000);
const PER_MINUTE = Number(process.env.AGENT_REQUESTS_PER_MINUTE ?? 20);
const MAX_BODY_BYTES = 600_000;

const Body = z.object({
  variant: z.object({
    planning: z.enum(["act", "plan-first"]),
    approval: z.enum(["each", "end", "auto"]),
    visibility: z.enum(["timeline", "narrative", "outcomes"]),
  }),
  // Shape-checked loosely; the API validates the blocks themselves.
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.union([z.string(), z.array(z.record(z.string(), z.unknown()))]) }))
    .min(1)
    .max(120),
});

/*
 * Rate limit and budget live in memory, per server instance. That's enough for a study with a
 * handful of testers on one deployment; a larger one would move them to a shared store.
 */
const recent = new Map<string, number[]>();
let budget = { day: new Date().toDateString(), used: 0 };

function limited(client: string): boolean {
  const now = Date.now();
  const hits = (recent.get(client) ?? []).filter((t) => now - t < 60_000);
  hits.push(now);
  recent.set(client, hits);
  return hits.length > PER_MINUTE;
}

function overBudget(): boolean {
  const day = new Date().toDateString();
  if (budget.day !== day) budget = { day, used: 0 };
  return budget.used >= DAILY_TOKENS;
}

const json = (status: number, error: string) => Response.json({ error }, { status });

/** Plain words for the errors a tester can hit, without leaking anything from the server. */
function explain(error: unknown): string {
  if (error instanceof Anthropic.RateLimitError) return "The agent is busy right now. Try again in a minute.";
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return "Live mode is misconfigured on the server.";
  }
  if (error instanceof Anthropic.BadRequestError) return "The agent couldn't accept this conversation. Start a new session.";
  if (error instanceof Anthropic.APIConnectionError) return "Couldn't reach the model. Check the connection and try again.";
  if (error instanceof Anthropic.APIError) return "The model service had a problem. Try again.";
  return "Something went wrong on the server.";
}

/** Whether live mode is set up, so the app can offer it. */
export function GET() {
  return Response.json({ live: Boolean(process.env.ANTHROPIC_API_KEY), model: MODEL });
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return json(503, "Live mode isn't configured on this server. Use a replay instead.");
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(client)) return json(429, "Too many requests. Wait a minute and try again.");
  if (overBudget()) return json(429, "Today's budget for live sessions is used up. Replays still work.");
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return json(413, "This conversation is too long. Start a new session.");

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return json(400, "That request didn't look like an agent conversation.");
  }

  const anthropic = new Anthropic();
  const tools = apiTools();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) => controller.enqueue(encoder.encode(encodeEvent(event)));
      try {
        const turn = anthropic.beta.messages.stream(
          {
            model: MODEL,
            max_tokens: MAX_TOKENS,
            betas: ["thinking-display-updates-2026-08-18", "server-side-fallback-2026-07-01"],
            // Adaptive thinking, shown as the short progress notes the model writes between
            // tool calls rather than its reasoning.
            thinking: { type: "adaptive", display: "updates" },
            output_config: { effort: EFFORT },
            // If a request is declined, the API retries it on a fallback model in the same call.
            fallbacks: "default",
            // The system prompt and tools are the stable prefix; cache them.
            system: [{ type: "text", text: systemPrompt(body.variant), cache_control: { type: "ephemeral" } }],
            tools: tools.map((tool, i) => (i === tools.length - 1 ? { ...tool, cache_control: { type: "ephemeral" } } : tool)),
            messages: body.messages as Anthropic.Beta.Messages.BetaMessageParam[],
          },
          { signal: request.signal },
        );
        for await (const event of turn) {
          const translated = translate(event);
          if (translated) send(translated);
        }
        const message = await turn.finalMessage();
        budget.used += message.usage.input_tokens + message.usage.output_tokens;
        send({
          type: "turn_end",
          message: {
            content: message.content as unknown as Anthropic.ContentBlock[],
            stop_reason: message.stop_reason as Anthropic.Message["stop_reason"],
            usage: message.usage as unknown as Anthropic.Usage,
          },
        });
      } catch (error) {
        // The user stopped the run: the client already knows.
        if (!request.signal.aborted) send({ type: "turn_error", message: explain(error) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" },
  });
}
