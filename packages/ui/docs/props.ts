/**
 * Reads a component's props from its source: the interface's own members, their JSDoc, and the
 * defaults the component destructures. TypeScript 7 ships no JavaScript compiler API, so this
 * is a small parser for the one shape Keystone's components are written in, and its tests pin
 * that shape down. `scripts/generate-props.ts` runs it and writes `props.generated.ts`.
 */

export interface PropDoc {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: string;
}

/**
 * If a string or comment starts at `i`, the index of its last character; otherwise `i`.
 * Comments matter: an apostrophe in "it's" isn't the start of a string.
 */
function skip(text: string, i: number): number {
  const c = text[i];
  const end = (found: number) => (found === -1 ? text.length - 1 : found);
  if (c === "/" && text[i + 1] === "/") return end(text.indexOf("\n", i));
  if (c === "/" && text[i + 1] === "*") {
    const close = text.indexOf("*/", i + 2);
    return close === -1 ? text.length - 1 : close + 1;
  }
  if (c === '"' || c === "'" || c === "`") return end(text.indexOf(c, i + 1));
  return i;
}

/** The text between the bracket at `open` and the one that closes it, skipping strings. */
function balanced(text: string, open: number): string {
  const pairs: Record<string, string> = { "{": "}", "(": ")", "[": "]", "<": ">" };
  const stack: string[] = [];
  for (let i = open; i < text.length; i++) {
    const skipped = skip(text, i);
    if (skipped !== i) {
      i = skipped;
      continue;
    }
    const c = text[i]!;
    // `=>` isn't a closing angle bracket.
    if (c === ">" && text[i - 1] === "=") continue;
    if (c in pairs) stack.push(pairs[c]!);
    else if (c === stack.at(-1)) {
      stack.pop();
      if (stack.length === 0) return text.slice(open + 1, i);
    }
  }
  throw new Error(`Unbalanced bracket at ${open}`);
}

/** Splits on `separator` where it isn't inside brackets or a string. */
function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const skipped = skip(text, i);
    if (skipped !== i) {
      i = skipped;
      continue;
    }
    const c = text[i]!;
    if ("{([".includes(c) || (c === "<" && /\w/.test(text[i - 1] ?? ""))) depth++;
    else if ("})]".includes(c) || (c === ">" && text[i - 1] !== "=" && depth > 0)) depth--;
    else if (c === separator && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

interface JsDoc {
  description: string;
  tags: Record<string, string>;
}

function parseJsDoc(comment: string): JsDoc {
  const lines = comment
    .trim()
    .replace(/^\/\*\*|\*\/$/g, "")
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, "").trim());
  const tags: Record<string, string> = {};
  const prose: string[] = [];
  for (const line of lines) {
    const tag = line.match(/^@(\w+)\s*(.*)$/);
    if (tag) tags[tag[1]!] = tag[2]!.trim();
    else prose.push(line);
  }
  return { description: prose.join(" ").replace(/\s+/g, " ").trim(), tags };
}

/** The body of `interface Name … { … }`. */
function interfaceBody(text: string, name: string): string {
  const match = new RegExp(`interface ${name}\\b`).exec(text);
  if (!match) throw new Error(`interface ${name} not found`);
  // The body is the first `{` after the name that isn't inside the extends clause's generics.
  let i = match.index + match[0].length;
  let depth = 0;
  for (; i < text.length; i++) {
    if (text[i] === "<") depth++;
    else if (text[i] === ">") depth--;
    else if (text[i] === "{" && depth === 0) break;
  }
  return balanced(text, i);
}

/** `export type Name = …;` aliases in a source file, so a table can show `"sm" | "md"` for FieldSize. */
export function typeAliases(text: string): Record<string, string> {
  return Object.fromEntries([...text.matchAll(/^export type (\w+) = ([^;]+);/gm)].map((m) => [m[1]!, m[2]!.replace(/\s+/g, " ").trim()]));
}

/** `name = value` defaults from the destructured parameter typed with the interface. */
function destructuredDefaults(text: string, name: string): Record<string, string> {
  const annotated = new RegExp(`\\}\\s*:\\s*${name}\\b`).exec(text);
  const forwarded = new RegExp(`forwardRef<[^>]*,\\s*${name}>\\(\\s*function \\w+\\(`).exec(text);
  let open: number;
  if (annotated) {
    // Walk back from the closing brace to its opening one.
    let depth = 0;
    open = annotated.index;
    for (; open >= 0; open--) {
      if (text[open] === "}") depth++;
      else if (text[open] === "{" && --depth === 0) break;
    }
  } else if (forwarded) {
    open = text.indexOf("{", forwarded.index + forwarded[0].length);
  } else {
    return {};
  }
  const defaults: Record<string, string> = {};
  for (const entry of splitTopLevel(balanced(text, open), ",")) {
    const eq = entry.indexOf("=");
    if (eq === -1 || entry.startsWith("...")) continue;
    const key = entry.slice(0, eq).split(":")[0]!.trim();
    defaults[key] = entry.slice(eq + 1).trim();
  }
  return defaults;
}

/**
 * The props `name` declares itself, in source order. Descriptions come from each member's JSDoc,
 * which is what editors show on hover too. Two tags adjust the table: `@default` for a default
 * that isn't a literal in the code ("the first enabled option"), and `@docsType` where the
 * declared type would mean less to a reader than a sketch of its shape.
 */
export function extractProps(text: string, name: string, aliases: Record<string, string> = {}): PropDoc[] {
  const body = interfaceBody(text, name);
  // A generic interface's type parameters read as their constraints: `T extends string` is string.
  const params = new RegExp(`interface ${name}<([^>]*)>`).exec(text)?.[1] ?? "";
  const generics = Object.fromEntries(
    splitTopLevel(params, ",").map((p) => {
      const [param, constraint] = p.split(/\s+extends\s+/);
      return [param!.trim(), constraint?.trim() ?? "unknown"];
    }),
  );
  const readable = (type: string) => {
    let out = aliases[type] ?? type;
    for (const [param, constraint] of Object.entries(generics)) out = out.replace(new RegExp(`\\b${param}\\b`, "g"), constraint);
    return out;
  };
  const defaults = destructuredDefaults(text, name);
  const props: PropDoc[] = [];
  // A member starts a line, optionally after its JSDoc.
  const member = /(\/\*\*[\s\S]*?\*\/\s*)?^[ 	]*("?[\w-]+"?)(\?)?:\s*/gm;
  let match: RegExpExecArray | null;
  while ((match = member.exec(body))) {
    // The type runs to the next top-level semicolon.
    const rest = body.slice(member.lastIndex);
    const type = splitTopLevel(rest, ";")[0]!;
    member.lastIndex += rest.indexOf(type) + type.length + 1;
    const doc = match[1] ? parseJsDoc(match[1]) : { description: "", tags: {} };
    const prop = match[2]!.replace(/"/g, "");
    const fallback = doc.tags.default ?? defaults[prop];
    props.push({
      name: prop,
      type: doc.tags.docsType ?? readable(type.replace(/\s+/g, " ").trim()),
      ...(fallback !== undefined && { default: fallback }),
      ...(!match[3] && { required: true }),
      description: doc.description,
    });
  }
  return props;
}
