import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_ROOT } from "../src/core/catalog.js";

function markdownFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "node_modules" || name.startsWith(".") ? [] : markdownFiles(path);
    return name.endsWith(".md") ? [path] : [];
  });
}

describe("documentación", () => {
  const files = [...markdownFiles(join(DEFAULT_ROOT, "docs")), ...markdownFiles(join(DEFAULT_ROOT, "methodology"))];

  it.each(files.map((f) => [f.slice(DEFAULT_ROOT.length + 1), f]))("%s: enlaces internos válidos", (_, file) => {
    const broken = [...readFileSync(file, "utf8").matchAll(/\]\(([^)#\s]+)(#[^)]*)?\)/g)]
      .map((m) => m[1]!)
      .filter((target) => !/^[a-z]+:/i.test(target))
      .filter((target) => !existsSync(resolve(dirname(file), target)));
    expect(broken).toEqual([]);
  });
});
