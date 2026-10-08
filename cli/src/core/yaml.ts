import { readFileSync } from "node:fs";
import matter from "gray-matter";
import YAML from "yaml";

// YAML 1.2 (core schema): fechas y "no"/"yes" se mantienen como texto.
export function parseYaml<T = unknown>(source: string): T {
  return YAML.parse(source) as T;
}

export function readYaml<T = unknown>(path: string): T {
  return parseYaml<T>(readFileSync(path, "utf8"));
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
