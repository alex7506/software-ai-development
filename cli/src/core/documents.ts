import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { markWritten } from "./format.js";
import { nextId, slugify, today } from "./ids.js";
import { CliError } from "./issues.js";
import type { DocumentRecord, Project } from "./project.js";
import { isApproved } from "./rules.js";
import type { SchemaRegistry } from "./schema.js";
import { schemaForDocumentType } from "./schema.js";
import { renderTemplate } from "./template.js";
import { parseMarkdown, stringifyMarkdown } from "./yaml.js";

export interface NewDocumentOptions {
  title: string;
  author: string;
  now: Date;
  /** Campos del frontmatter que sustituyen a los de la plantilla (null elimina el campo). */
  fields?: Record<string, unknown>;
}

/** Crea un documento desde su plantilla con el siguiente ID libre, en la carpeta canónica de su tipo. */
export function createDocument(p: Project, type: string, opts: NewDocumentOptions): DocumentRecord {
  const def = p.cat.documentTypes.types[type];
  if (!def) throw new CliError(`Tipo de documento desconocido: ${type}`);
  const id = nextId(def.id_prefix, p.documents().map((d) => d.id));
  const m = p.methodology;
  const values: Record<string, string> = {
    id,
    title: opts.title,
    project_id: m.project.id,
    project_name: m.project.name,
    methodology_version: m.methodology.version,
    date: today(opts.now),
    datetime: opts.now.toISOString(),
    author: opts.author,
    mode: m.mode,
    objective: opts.title,
  };
  const source = readFileSync(join(p.cat.root, "templates/documents", def.template), "utf8");
  // Los marcadores sin valor quedan como UNKNOWN: la validación obliga a completarlos.
  const rendered = renderTemplate(source, values).replace(/\{\{\s*[a-z_]+\s*\}\}/g, "UNKNOWN");
  const doc = parseMarkdown(rendered);
  for (const [key, value] of Object.entries(opts.fields ?? {})) {
    if (value === null) delete doc.data[key];
    else doc.data[key] = value;
  }

  const file = p.path("docs", p.folderFor(type), `${id}-${slugify(opts.title) || "documento"}.md`);
  if (existsSync(file)) throw new CliError(`Ya existe ${relative(p.root, file)}.`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, stringifyMarkdown(doc));
  markWritten(p.root, file);
  p.invalidate();
  return p.document(id);
}

/** Valida el frontmatter de un documento modificado antes de guardarlo. */
export function saveValidated(p: Project, registry: SchemaRegistry, doc: DocumentRecord): void {
  const result = registry.validate(schemaForDocumentType(p.cat, doc.type), doc.data);
  if (!result.valid) throw new CliError(`El cambio dejaría ${doc.id} inválido:\n  ${result.errors.join("\n  ")}`);
  p.saveDocument(doc);
}

/** Estado de revisión al que pasa un documento al enviarse a aprobación. */
const REVIEW_TRANSITION: Record<string, { from: string[]; to: string }> = {
  ADR: { from: ["PROPOSED"], to: "PROPOSED" },
  CHANGE_REQUEST: { from: ["PROPOSED"], to: "ANALYZING" },
};
const DEFAULT_REVIEW = { from: ["DRAFT"], to: "IN_REVIEW" };

export function reviewStatus(type: string): string {
  return (REVIEW_TRANSITION[type] ?? DEFAULT_REVIEW).to;
}

export function submitDocument(p: Project, registry: SchemaRegistry, id: string, now: Date): DocumentRecord {
  const doc = p.document(id);
  if (doc.type === "TASK") throw new CliError("Las tareas no se envían a aprobación; se revisan al cerrarlas (`ai-dev task complete --reviewed-by`).");
  const t = REVIEW_TRANSITION[doc.type] ?? DEFAULT_REVIEW;
  const status = String(doc.data.status);
  if (status === t.to) throw new CliError(`${id} ya está en ${status}.`);
  if (!t.from.includes(status)) throw new CliError(`${id} está en ${status}; solo se puede enviar a revisión desde ${t.from.join(" o ")}.`);
  doc.data.status = t.to;
  doc.data.updated_at = today(now);
  saveValidated(p, registry, doc);
  return doc;
}

/** Reabre un documento aprobado para modificarlo: vuelve a revisión y sube la versión menor. */
export function reviseDocument(p: Project, registry: SchemaRegistry, id: string, now: Date): DocumentRecord {
  const doc = p.document(id);
  if (doc.type === "ADR") throw new CliError("Un ADR aceptado no se modifica: crea uno nuevo con una relación SUPERSEDES.");
  if (doc.type === "TASK") throw new CliError("Las tareas no se revisan con este comando; usa `ai-dev task`.");
  if (!isApproved(doc)) throw new CliError(`${id} no está aprobado (estado ${String(doc.data.status)}); puedes editarlo directamente.`);
  doc.data.status = reviewStatus(doc.type);
  doc.data.version = bumpMinor(String(doc.data.version));
  doc.data.approved_by = null;
  doc.data.approved_at = null;
  doc.data.updated_at = today(now);
  saveValidated(p, registry, doc);
  return doc;
}

export function bumpMinor(version: string): string {
  const [major = "0", minor = "0"] = version.split(".");
  return `${major}.${Number(minor) + 1}.0`;
}
