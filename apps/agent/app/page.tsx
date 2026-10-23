import { AgentApp } from "./AgentApp";

/** `?speed=fast` plays replays without delays, for tests. */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { speed } = await searchParams;
  return <AgentApp fast={speed === "fast"} />;
}
