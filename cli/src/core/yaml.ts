import { readFileSync, writeFileSync } from "node:fs";
import matter from "gray-matter";
import YAML from "yaml";

// YAML 1.2 (core schema): fechas y "no"/"yes" se mantienen como texto.
export function parseYaml<T = unknown>(source: string): T {
  return YAML.parse(source) as T;
}

export function readYaml<T = unknown>(path: string): T {
  return parseYaml<T>(readFileSync(path, "utf8"));
}

export function stringifyYaml(data: unknown): string {
  return YAML.stringify(data, { lineWidth: 0 });
}

/** Reescribe un YAML conservando los comentarios de cabecera del archivo existente. */
export function writeYaml(path: string, data: unknown, header?: string): void {
  writeFileSync(path, (header ? `${header.trimEnd()}\n` : "") + stringifyYaml(data));
}

export function leadingComments(path: string): string {
  const lines = readFileSync(path, "utf8").split("\n");
  const end = lines.findIndex((l) => !l.startsWith("#"));
  return lines.slice(0, end < 0 ? lines.length : end).join("\n");
}

export interface MarkdownDocument {
  data: Record<string, unknown>;
  content: string;
}

export function parseMarkdown(source: string): MarkdownDocument {
  const parsed = matter(source, {
    engines: { yaml: (s: string) => (parseYaml(s) ?? {}) as object },
  });
  return { data: parsed.data, content: parsed.content };
}

export function stringifyMarkdown(doc: MarkdownDocument): string {
  return `---\n${stringifyYaml(doc.data)}---\n${doc.content}`;
}
