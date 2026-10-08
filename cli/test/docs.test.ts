import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildProgram } from "../src/cli.js";
import { DEFAULT_ROOT, loadCatalog } from "../src/core/catalog.js";
import { generateReference } from "../src/docs/reference.js";

function markdownFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "node_modules" || name.startsWith(".") ? [] : markdownFiles(path);
    return name.endsWith(".md") ? [path] : [];
  });
}

describe("referencia generada", () => {
  it("docs/referencia está al día con la CLI y el catálogo (si falla: npm run docs:gen)", () => {
    const silent = () => {};
    const { program } = buildProgram({ cwd: DEFAULT_ROOT, now: () => new Date(), out: silent, err: silent, interactive: false, ask: async () => "" });
    const expected = generateReference(loadCatalog(), program);
    const dir = join(DEFAULT_ROOT, "docs/referencia");
    const onDisk = markdownFiles(dir).map((f) => f.slice(dir.length + 1)).sort();
    expect(onDisk).toEqual([...expected.keys()].sort());
    for (const [rel, content] of expected) expect(readFileSync(join(dir, rel), "utf8"), rel).toBe(content);
  });
});

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
