import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { readYaml } from "./yaml.js";

// Archivos que la CLI escribe en cada proyecto durante un comando. Al terminar, se les pasa el
// formateador del proyecto (`format_command`) para que el gate CODE no falle por el estilo de
// lo que escribió la propia CLI (p. ej. las comillas que elige Prettier en el YAML).
const pending = new Map<string, Set<string>>();

export function markWritten(root: string, file: string): void {
  const files = pending.get(root) ?? new Set<string>();
  files.add(file);
  pending.set(root, files);
}

const quote = (s: string) => JSON.stringify(s);

/** Ejecuta `format_command` del proyecto sobre unos archivos. Devuelve el aviso si falla, o null. */
export function formatFiles(root: string, files: Iterable<string>): string | null {
  const config = join(root, ".ai-dev/configuration.yaml");
  const command = existsSync(config) ? readYaml<{ format_command?: string } | null>(config)?.format_command : undefined;
  const targets = [...files].filter((f) => existsSync(f)).map((f) => relative(root, f));
  if (!command || targets.length === 0) return null;
  try {
    execSync(`${command} ${targets.map(quote).join(" ")}`, { cwd: root, stdio: "pipe" });
    return null;
  } catch (e) {
    const detail = (e as { stderr?: Buffer }).stderr?.toString().trim().split("\n")[0];
    return `No se pudo ejecutar format_command (\`${command}\`) sobre ${targets.join(", ")}${detail ? `: ${detail}` : ""}. Los archivos se guardaron sin formatear.`;
  }
}

/** Formatea lo escrito durante el comando y devuelve los avisos. Vacía la lista. */
export function formatWritten(): string[] {
  const warnings = [...pending].map(([root, files]) => formatFiles(root, files)).filter((w): w is string => w !== null);
  pending.clear();
  return warnings;
}
