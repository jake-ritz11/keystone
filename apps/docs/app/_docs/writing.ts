/**
 * The project's write-ups, rendered from docs/*.md at build time so they read as pages on the
 * site, not files on GitHub. Links between write-ups become site routes; links into the code go
 * to GitHub; headings get ids so sections can be linked to.
 */
import { readFileSync } from "node:fs";
import { join, posix } from "node:path";
import { Marked, type Tokens } from "marked";
import { REPO, WRITING, type Writing } from "./registry";

export { WRITING, type Writing } from "./registry";

const DOCS = join(process.cwd(), "..", "..", "docs");

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Where a link in docs/ should go on the site. */
export function resolveLink(href: string): { href: string; external: boolean } {
  if (/^(https?:|mailto:)/.test(href)) return { href, external: true };
  if (href.startsWith("#")) return { href, external: false };
  const [path = "", hash = ""] = href.split("#");
  const target = WRITING.find((w) => w.file === posix.basename(path) && !path.includes("/"));
  if (target) return { href: `/writing/${target.slug}${hash ? `#${hash}` : ""}`, external: false };
  // Anything else is part of the repo: show it on GitHub.
  const resolved = posix.normalize(posix.join("docs", path));
  return { href: `${REPO}/blob/main/${resolved}${hash ? `#${hash}` : ""}`, external: true };
}

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function renderer() {
  return new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }: Tokens.Heading) {
        const html = this.parser.parseInline(tokens);
        const id = slugify(html);
        return `<h${depth} id="${id}">${html}</h${depth}>\n`;
      },
      link({ href, title, tokens }: Tokens.Link) {
        const { href: to, external } = resolveLink(href);
        const text = this.parser.parseInline(tokens);
        const attrs = external ? ` rel="noopener noreferrer"` : "";
        return `<a href="${escape(to)}"${title ? ` title="${escape(title)}"` : ""}${attrs}>${text}</a>`;
      },
      table(token: Tokens.Table) {
        const head = token.header.map((cell) => `<th scope="col">${this.parser.parseInline(cell.tokens)}</th>`).join("");
        const body = token.rows
          .map((row) => `<tr>${row.map((cell, i) => (i === 0 ? `<th scope="row">${this.parser.parseInline(cell.tokens)}</th>` : `<td>${this.parser.parseInline(cell.tokens)}</td>`)).join("")}</tr>`)
          .join("");
        const label = escape(token.header.map((c) => c.text).join(", "));
        return `<div class="table-scroll" role="region" aria-label="Table: ${label}" tabindex="0"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>\n`;
      },
      code({ text }: Tokens.Code) {
        return `<pre class="prose-code" tabindex="0"><code>${escape(text)}</code></pre>\n`;
      },
    },
  });
}

/** One write-up as HTML, without its own top heading (the page supplies that). */
export function renderWriting(writing: Writing): string {
  const source = readFileSync(join(DOCS, writing.file), "utf8").replace(/^# .*\n+/, "");
  return renderer().parse(source, { async: false }) as string;
}
