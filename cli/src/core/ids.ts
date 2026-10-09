import { CliError } from "./issues.js";

export const prefixOf = (id: string) => id.split("-")[0] ?? "";

/** Siguiente ID con el prefijo dado: el mayor número existente + 1, con tres dígitos. */
export function nextId(prefix: string, existing: Iterable<string>): string {
  let max = 0;
  for (const id of existing) {
    const m = new RegExp(`^${prefix}-(\\d{3,})[A-Z]?$`).exec(id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

/** Acepta el tipo (PRD, task, tech_design) o su prefijo (TD, adr) y devuelve el tipo canónico. */
export function resolveDocumentType(input: string, types: Record<string, { id_prefix: string }>): string {
  const norm = input.trim().toUpperCase().replace(/-/g, "_");
  if (types[norm]) return norm;
  const byPrefix = Object.entries(types).find(([, t]) => t.id_prefix === norm);
  if (byPrefix) return byPrefix[0];
  throw new CliError(`Tipo de documento desconocido: ${input}. Tipos válidos: ${Object.keys(types).join(", ")}.`);
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/** Fecha de calendario local (YYYY-MM-DD): la del día en que trabaja la persona, no la de UTC. */
export const today = (now: Date) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
