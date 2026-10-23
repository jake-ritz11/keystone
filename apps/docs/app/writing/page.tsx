import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "../_docs/blocks";
import { WRITING } from "../_docs/writing";

export const metadata: Metadata = { title: "Writing" };

export default function WritingIndex() {
  return (
    <DocPage title="Writing" lede="The reasoning behind the project, kept with the code and written as it was built.">
      <ul className="cards">
        {WRITING.map((w) => (
          <li key={w.slug}>
            <Link href={`/writing/${w.slug}`} className="card">
              <span className="card-title">{w.title}</span>
              <span className="card-summary">{w.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </DocPage>
  );
}
