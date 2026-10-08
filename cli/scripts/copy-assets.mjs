// Copia la metodología dentro del paquete: la CLI instalada usa exactamente la versión con la que se publicó.
import { cpSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const cli = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(cli, "..");
const assets = join(cli, "assets");

rmSync(assets, { recursive: true, force: true });
for (const entry of ["VERSION", "methodology/catalog", "schemas", "templates", "agents", "technology-profiles"]) {
  cpSync(join(repo, entry), join(assets, entry), { recursive: true });
}
console.log(`Metodología copiada en ${assets}`);
