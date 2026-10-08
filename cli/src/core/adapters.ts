import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { CliError } from "./issues.js";
import type { Project } from "./project.js";
import { renderTemplate } from "./template.js";

export interface AdapterFile {
  template: string;
  target: string;
  kind: "markdown" | "json-merge";
  block?: string;
}

export interface AdapterDef {
  name: string;
  tools: string[];
  files: AdapterFile[];
}

export interface AdapterRegistry {
  base: string;
  adapters: Record<string, AdapterDef>;
}

export type FileStatus = "MISSING" | "UP_TO_DATE" | "OUTDATED" | "MODIFIED" | "UNMANAGED" | "INVALID";
export type SyncAction = "CREATED" | "UPDATED" | "APPENDED" | "MERGED" | "UNCHANGED" | "SKIPPED_MODIFIED" | "SKIPPED_INVALID";

export interface AdapterFileState {
  adapter: string;
  target: string;
  status: FileStatus;
}

const END = "<!-- ai-dev:end -->";
const BLOCK_RE = /<!-- ai-dev:begin adapter=(\S+) hash=([0-9a-f]+)[^>]*-->\n([\s\S]*?)\n<!-- ai-dev:end -->/;

const hash = (text: string) => createHash("sha256").update(text.trim()).digest("hex").slice(0, 12);
const begin = (adapter: string, h: string) =>
  `<!-- ai-dev:begin adapter=${adapter} hash=${h} — Generado por \`ai-dev adapters sync\`. No edites dentro del bloque: se regenera desde .ai-dev/ y la metodología. -->`;

/** Adaptadores activos del proyecto; el adaptador base siempre está incluido. */
export function enabledAdapters(p: Project): string[] {
  const registry = p.cat.adapters;
  const configured = p.configuration.adapters ?? Object.keys(registry.adapters);
  const unknown = configured.filter((a) => !registry.adapters[a]);
  if (unknown.length) throw new CliError(`Adaptadores desconocidos en configuration.yaml: ${unknown.join(", ")}.`);
  return [...new Set([registry.base, ...configured])];
}

/** Texto común de reglas (adapters/core.md) rellenado con el catálogo y la configuración del proyecto. */
export function renderCore(p: Project): string {
  const cat = p.cat;
  const m = p.methodology;
  const config = p.configuration;
  const maxAutonomy = p.modeDef.max_autonomy_level;
  const providers = config.providers ?? [];

  const actions: Record<string, string> = {
    none: "Procede y deja constancia en la tarea.",
    post_review: "Procede dentro del alcance; una persona revisará después.",
    pre_approval: "Detente y pide aprobación a una persona antes de ejecutar.",
    pre_approval_human_executes: "No la ejecutes: propón la operación y una persona la ejecuta o confirma.",
  };
  const riskTable = [
    "| Riesgo | Qué haces | Operaciones de este nivel |",
    "|---|---|---|",
    ...Object.entries(cat.risk.levels).map(([level, def]) => {
      const caps = Object.entries(cat.capabilities.capabilities).filter(([, c]) => c.risk === level).map(([c]) => `\`${c}\``);
      return `| ${level} | ${actions[def.approval] ?? def.approval} | ${caps.join(", ") || "—"} |`;
    }),
  ].join("\n");

  const dataTable = [
    "| Clasificación | Destinos permitidos | Proveedores del proyecto permitidos |",
    "|---|---|---|",
    ...Object.entries(cat.dataClassification.levels).map(([level, def]) => {
      const allowed = providers.filter((pr) => def.allowed_destinations.includes(pr.destination_type)).map((pr) => pr.name);
      return `| ${level} | ${def.allowed_destinations.map((d) => `\`${d}\``).join(", ") || "ninguno"} | ${allowed.join(", ") || "—"} |`;
    }),
  ].join("\n");

  const local = p.hasAiDev("policies") ? (p.readAiDev<{ local_policies?: { id: string; description: string }[] }>("policies").local_policies ?? []) : [];
  const policies = [
    ...cat.policies.policies.map((pol) => `- \`${pol.id}\`: ${(pol as { description?: string }).description ?? ""}`),
    ...local.map((pol) => `- \`${pol.id}\` (política local): ${pol.description}`),
  ].join("\n");

  const values: Record<string, string> = {
    project_name: m.project.name,
    methodology_version: m.methodology.version,
    mode: m.mode,
    retry_limit: String(p.limit("max_auto_fix_attempts")),
    ai_context_lines: String(p.limit("max_ai_context_md_lines")),
    review_rule: p.modeDef.separation_of_duties
      ? "El cierre (`ai-dev task complete`) requiere la revisión de una persona distinta a quien ejecutó la tarea."
      : "Una persona confirma el cierre con `ai-dev task complete`.",
    max_autonomy: String(maxAutonomy),
    max_autonomy_name: String(cat.capabilities.autonomy_levels?.[maxAutonomy]?.description ?? "").replace(/\.$/, ""),
    risk_table: riskTable,
    data_max: config.data_classification_max ?? "UNKNOWN",
    data_table: dataTable,
    policies,
  };
  return renderTemplate(readFileSync(join(cat.root, "adapters/core.md"), "utf8"), values).trim();
}

function blockContent(p: Project, file: AdapterFile, core: string): string {
  if (!file.block) return core;
  return renderTemplate(readFileSync(join(p.cat.root, "adapters", file.block), "utf8"), { project_name: p.methodology.project.name }).trim();
}

function managedBlock(adapter: string, content: string): string {
  return `${begin(adapter, hash(content))}\n${content}\n${END}`;
}

function inspectMarkdown(existing: string, desired: string): FileStatus {
  const match = BLOCK_RE.exec(existing);
  if (!match) return "UNMANAGED";
  const [, , recorded, current = ""] = match;
  if (hash(current) !== recorded) return "MODIFIED";
  return recorded === hash(desired) ? "UP_TO_DATE" : "OUTDATED";
}

type JsonObject = Record<string, unknown>;

/** Une las listas de permisos de la plantilla con las del archivo existente sin quitar nada. */
function mergeJson(existing: JsonObject, template: JsonObject): { merged: JsonObject; changed: boolean } {
  let changed = false;
  const merged: JsonObject = structuredClone(existing);
  const tPerms = (template.permissions ?? {}) as Record<string, string[]>;
  const perms = ((merged.permissions ??= {}) as Record<string, string[]>);
  for (const [key, entries] of Object.entries(tPerms)) {
    const current = Array.isArray(perms[key]) ? perms[key] : [];
    const missing = entries.filter((e) => !current.includes(e));
    if (missing.length) {
      perms[key] = [...current, ...missing];
      changed = true;
    }
  }
  return { merged, changed };
}

function readJson(path: string): JsonObject | null {
  try {
    const value = JSON.parse(readFileSync(path, "utf8"));
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

function plan(p: Project) {
  const core = renderCore(p);
  return enabledAdapters(p).flatMap((adapter) =>
    p.cat.adapters.adapters[adapter]!.files.map((file) => ({ adapter, file, path: p.path(file.target), content: file.kind === "markdown" ? blockContent(p, file, core) : "" })),
  );
}

export function adapterStatus(p: Project): AdapterFileState[] {
  return plan(p).map(({ adapter, file, path, content }) => {
    if (!existsSync(path)) return { adapter, target: file.target, status: "MISSING" as const };
    if (file.kind === "json-merge") {
      const existing = readJson(path);
      if (!existing) return { adapter, target: file.target, status: "INVALID" as const };
      const template = JSON.parse(readFileSync(join(p.cat.root, "adapters", file.template), "utf8"));
      return { adapter, target: file.target, status: mergeJson(existing, template).changed ? ("OUTDATED" as const) : ("UP_TO_DATE" as const) };
    }
    return { adapter, target: file.target, status: inspectMarkdown(readFileSync(path, "utf8"), content) };
  });
}

/** Genera o actualiza los archivos de los adaptadores activos. Nunca pisa ediciones manuales del bloque salvo con `force`. */
export function syncAdapters(p: Project, opts: { force?: boolean } = {}): (AdapterFileState & { action: SyncAction })[] {
  return plan(p).map(({ adapter, file, path, content }) => {
    const templatePath = join(p.cat.root, "adapters", file.template);
    const result = (status: FileStatus, action: SyncAction) => ({ adapter, target: file.target, status, action });
    mkdirSync(dirname(path), { recursive: true });

    if (file.kind === "json-merge") {
      const template = JSON.parse(readFileSync(templatePath, "utf8")) as JsonObject;
      if (!existsSync(path)) {
        writeFileSync(path, `${JSON.stringify(template, null, 2)}\n`);
        return result("UP_TO_DATE", "CREATED");
      }
      const existing = readJson(path);
      if (!existing) return result("INVALID", "SKIPPED_INVALID");
      const { merged, changed } = mergeJson(existing, template);
      if (changed) writeFileSync(path, `${JSON.stringify(merged, null, 2)}\n`);
      return result("UP_TO_DATE", changed ? "MERGED" : "UNCHANGED");
    }

    const block = managedBlock(adapter, content);
    if (!existsSync(path)) {
      writeFileSync(path, `${renderTemplate(readFileSync(templatePath, "utf8"), { block }).trimEnd()}\n`);
      return result("UP_TO_DATE", "CREATED");
    }
    const existing = readFileSync(path, "utf8");
    const status = inspectMarkdown(existing, content);
    if (status === "UNMANAGED") {
      writeFileSync(path, `${existing.trimEnd()}\n\n${block}\n`);
      return result("UP_TO_DATE", "APPENDED");
    }
    if (status === "MODIFIED" && !opts.force) return result("MODIFIED", "SKIPPED_MODIFIED");
    if (status === "UP_TO_DATE") return result("UP_TO_DATE", "UNCHANGED");
    writeFileSync(path, existing.replace(BLOCK_RE, () => block));
    return result("UP_TO_DATE", "UPDATED");
  });
}
