// Regenera docs/referencia desde la CLI y el catálogo. La CI falla si el resultado difiere de lo versionado.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { buildProgram } from "../src/cli.js";
import { DEFAULT_ROOT, loadCatalog } from "../src/core/catalog.js";
import { generateReference } from "../src/docs/reference.js";

const silent = () => {};
const { program } = buildProgram({ cwd: process.cwd(), now: () => new Date(), out: silent, err: silent, interactive: false, ask: async () => "" });
const target = join(DEFAULT_ROOT, "docs/referencia");
rmSync(target, { recursive: true, force: true });
for (const [rel, content] of generateReference(loadCatalog(), program)) {
  mkdirSync(dirname(join(target, rel)), { recursive: true });
  writeFileSync(join(target, rel), content);
}
console.log(`Referencia generada en ${target}`);
