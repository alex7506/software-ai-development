import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import type { Catalog } from "./catalog.js";
import { CliError } from "./issues.js";
import { leadingComments, parseMarkdown, readYaml, stringifyMarkdown, writeYaml, type MarkdownDocument } from "./yaml.js";

export const AI_DEV_DIR = ".ai-dev";
export const AI_DEV_FILES = {
  methodology: "methodology.yaml",
  configuration: "configuration.yaml",
  policies: "policies.yaml",
  state: "state.yaml",
  approvals: "approvals.yaml",
} as const;
export type AiDevFile = keyof typeof AI_DEV_FILES;

export interface MethodologyFile {
  methodology: { id: string; version: string };
  project: { id: string; name: string; description?: string };
  mode: string;
  technology_profile: string | null;
  adopted_at: string | null;
}

export interface ConfigurationFile {
  features: Record<string, boolean>;
  data_classification_max?: string;
  providers?: { name: string; destination_type: string }[];
  agents?: { agent_id: string; type: string; provider: string; capabilities: string[]; max_autonomy_level: number }[];
  limits?: Record<string, number>;
  environments?: string[];
  gate_commands?: Record<string, string>;
}

export interface StateFile {
  phase: string;
  status: string;
  current_task: string | null;
  pending_decisions: string[];
  blocked_reason: string | null;
  phase_started_at?: string;
  updated_at: string;
}

export interface Approval {
  id: string;
  target_type: "PHASE" | "DOCUMENT" | "TASK" | "CHANGE" | "RELEASE";
  target: string;
  target_version?: string;
  target_hash?: string;
  decision: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
  by: string;
  role: string;
  at: string;
  comment?: string;
}

export interface DocumentRecord extends MarkdownDocument {
  file: string;
  rel: string;
  id: string;
  type: string;
}

export interface Requirement {
  id: string;
  title: string;
  status: string;
  priority: string;
  acceptance_criteria: { id: string; description: string }[];
  relations?: { type: string; target: string; confidence?: number; confirmed?: boolean }[];
  [key: string]: unknown;
}

export interface RequirementsFile {
  project: string;
  prd_ref: string;
  requirements: Requirement[];
}

export const REQUIREMENTS_FILE = "docs/01-product/requirements.yaml";

export function findProjectRoot(cwd: string): string | null {
  let dir = cwd;
  for (;;) {
    if (existsSync(join(dir, AI_DEV_DIR, AI_DEV_FILES.methodology))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export class Project {
  private docsCache: DocumentRecord[] | null = null;

  private constructor(
    readonly root: string,
    readonly cat: Catalog,
  ) {}

  static load(cwd: string, cat: Catalog): Project {
    const root = findProjectRoot(cwd);
    if (!root) throw new CliError("No hay un proyecto ai-dev en este directorio ni en sus padres. Ejecuta `ai-dev init`.");
    return new Project(root, cat);
  }

  static at(root: string, cat: Catalog): Project {
    return new Project(root, cat);
  }

  path(...parts: string[]): string {
    return join(this.root, ...parts);
  }

  aiDevPath(file: AiDevFile): string {
    return this.path(AI_DEV_DIR, AI_DEV_FILES[file]);
  }

  hasAiDev(file: AiDevFile): boolean {
    return existsSync(this.aiDevPath(file));
  }

  readAiDev<T>(file: AiDevFile): T {
    const path = this.aiDevPath(file);
    if (!existsSync(path)) throw new CliError(`Falta ${AI_DEV_DIR}/${AI_DEV_FILES[file]}. Ejecuta \`ai-dev init\` para completarlo.`);
    return readYaml<T>(path);
  }

  writeAiDev(file: AiDevFile, data: unknown): void {
    const path = this.aiDevPath(file);
    writeYaml(path, data, existsSync(path) ? leadingComments(path) : undefined);
  }

  get methodology(): MethodologyFile {
    return this.readAiDev<MethodologyFile>("methodology");
  }

  get configuration(): ConfigurationFile {
    return this.readAiDev<ConfigurationFile>("configuration");
  }

  get state(): StateFile {
    return this.readAiDev<StateFile>("state");
  }

  saveState(changes: Partial<StateFile>, now: Date): StateFile {
    const next = { ...this.state, ...changes, updated_at: now.toISOString() };
    this.writeAiDev("state", next);
    return next;
  }

  get approvals(): Approval[] {
    return this.readAiDev<{ approvals: Approval[] | null }>("approvals").approvals ?? [];
  }

  appendApproval(approval: Approval): void {
    this.writeAiDev("approvals", { approvals: [...this.approvals, approval] });
  }

  get mode(): string {
    return this.methodology.mode;
  }

  get modeDef() {
    const def = this.cat.modes.modes[this.mode];
    if (!def) throw new CliError(`Modo desconocido en methodology.yaml: ${this.mode}`);
    return def;
  }

  /** Límite efectivo: el del proyecto si es más restrictivo que el del catálogo. */
  limit(name: string): number {
    const base = Number(this.cat.limits[name]);
    const local = this.hasAiDev("configuration") ? this.configuration.limits?.[name] : undefined;
    return local === undefined ? base : Math.min(base, local);
  }

  feature(name: string): boolean {
    return this.configuration.features?.[name] === true;
  }

  // --- Documentos -------------------------------------------------------------

  documents(): DocumentRecord[] {
    if (this.docsCache) return this.docsCache;
    const dir = this.path("docs");
    this.docsCache = existsSync(dir)
      ? markdownFiles(dir).flatMap((file) => {
          const parsed = parseMarkdown(readFileSync(file, "utf8"));
          const id = parsed.data.document_id;
          if (typeof id !== "string") return [];
          return [{ ...parsed, file, rel: relative(this.root, file), id, type: String(parsed.data.document_type ?? "") }];
        })
      : [];
    return this.docsCache;
  }

  document(id: string): DocumentRecord {
    const doc = this.documents().find((d) => d.id === id);
    if (!doc) throw new CliError(`No existe ningún documento con ID ${id}.`);
    return doc;
  }

  tasks(): DocumentRecord[] {
    return this.documents().filter((d) => d.type === "TASK");
  }

  saveDocument(doc: DocumentRecord): void {
    writeFileSync(doc.file, stringifyMarkdown(doc));
    this.docsCache = null;
  }

  invalidate(): void {
    this.docsCache = null;
  }

  requirementsFile(): RequirementsFile | null {
    const path = this.path(REQUIREMENTS_FILE);
    return existsSync(path) ? readYaml<RequirementsFile>(path) : null;
  }

  requirements(): Requirement[] {
    return this.requirementsFile()?.requirements ?? [];
  }

  /** IDs conocidos: documentos y requisitos. */
  knownIds(): Set<string> {
    return new Set([...this.documents().map((d) => d.id), ...this.requirements().map((r) => r.id)]);
  }
}

function markdownFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return markdownFiles(path);
    return name.endsWith(".md") ? [path] : [];
  });
}
