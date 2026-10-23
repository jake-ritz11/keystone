import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocPage } from "../../_docs/blocks";
import { renderWriting, WRITING } from "../../_docs/writing";

export function generateStaticParams() {
  return WRITING.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: WRITING.find((w) => w.slug === slug)?.title ?? "Writing" };
}

export default async function WritingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const writing = WRITING.find((w) => w.slug === slug);
  if (!writing) notFound();
  return (
    <DocPage title={writing.title} lede={writing.summary} source={`docs/${writing.file}`}>
      {/* Our own Markdown, rendered at build time. */}
      <div className="prose" dangerouslySetInnerHTML={{ __html: renderWriting(writing) }} />
    </DocPage>
  );
}
