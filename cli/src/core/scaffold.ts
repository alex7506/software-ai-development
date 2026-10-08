import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Catalog } from "./catalog.js";
import { createDocument } from "./documents.js";
import { slugify, today } from "./ids.js";
import { CliError } from "./issues.js";
import { AI_DEV_DIR, AI_DEV_FILES, Project, REQUIREMENTS_FILE, findProjectRoot } from "./project.js";
import { renderTemplate } from "./template.js";
import { leadingComments, parseYaml, writeYaml } from "./yaml.js";

export interface InitOptions {
  name: string;
  id?: string;
  mode: string;
  profile?: string | null;
  author: string;
  /** Fase inicial; solo admitida al adoptar un proyecto existente. */
  phase?: string;
  methodologyVersion: string;
  now: Date;
}

export interface InitResult {
  root: string;
  created: string[];
  kept: string[];
  adopted: boolean;
}

/** Archivos y carpetas que no cuentan para decidir si un directorio ya contiene un proyecto. */
const NEUTRAL_ENTRIES = new Set([".git", ".gitignore", ".gitattributes", "README.md", "LICENSE", ".DS_Store", ".vscode", ".idea", AI_DEV_DIR]);

const GITIGNORE_ENTRIES = [".env", ".env.*", "!.env.example"];

/**
 * Instala la metodología en `root`. Es idempotente: nunca sobrescribe archivos existentes, solo crea los que faltan.
 * Si el directorio ya contenía código, el proyecto se marca como adoptado (brownfield).
 */
export function initProject(cat: Catalog, root: string, opts: InitOptions): InitResult {
  const parent = findProjectRoot(dirname(root));
  if (parent && parent !== root) throw new CliError(`Ya hay un proyecto ai-dev en ${parent}; no se anidan proyectos.`);
  if (!cat.modes.order.includes(opts.mode)) throw new CliError(`Modo desconocido: ${opts.mode}. Usa ${cat.modes.order.join(", ")}.`);
  if (!existsSync(root)) mkdirSync(root, { recursive: true });

  const alreadyInitialized = existsSync(join(root, AI_DEV_DIR, AI_DEV_FILES.methodology));
  const adopted = !alreadyInitialized && readdirSync(root).some((e) => !NEUTRAL_ENTRIES.has(e));
  if (opts.phase && !adopted && !alreadyInitialized) throw new CliError("--phase solo se usa al adoptar un proyecto existente; un proyecto nuevo empieza en INTAKE.");
  if (opts.phase && !cat.phases.order.includes(opts.phase)) throw new CliError(`Fase desconocida: ${opts.phase}.`);

  const id = opts.id ?? slugify(opts.name);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new CliError(`ID de proyecto inválido: "${id}". Usa minúsculas, números y guiones (--id).`);

  const values: Record<string, string> = {
    project_id: id,
    project_name: opts.name,
    methodology_version: opts.methodologyVersion,
    mode: opts.mode,
    date: today(opts.now),
    datetime: opts.now.toISOString(),
    author: opts.author,
  };
  const result: InitResult = { root, created: [], kept: [], adopted };
  const templates = join(cat.root, "templates/project");

  const place = (template: string, target: string, adjust?: (data: Record<string, unknown>) => void) => {
    const dest = join(root, target);
    if (existsSync(dest)) return void result.kept.push(target);
    mkdirSync(dirname(dest), { recursive: true });
    const rendered = renderTemplate(readFileSync(join(templates, template), "utf8"), values);
    writeFileSync(dest, rendered);
    if (adjust) {
      const data = parseYaml<Record<string, unknown>>(rendered);
      adjust(data);
      writeYaml(dest, data, leadingComments(dest));
    }
    result.created.push(target);
  };

  place(".ai-dev/methodology.yaml", `${AI_DEV_DIR}/${AI_DEV_FILES.methodology}`, (d) => {
    d.technology_profile = opts.profile ?? null;
    d.adopted_at = adopted ? today(opts.now) : null;
  });
  place(".ai-dev/configuration.yaml", `${AI_DEV_DIR}/${AI_DEV_FILES.configuration}`);
  place(".ai-dev/policies.yaml", `${AI_DEV_DIR}/${AI_DEV_FILES.policies}`);
  place(".ai-dev/state.yaml", `${AI_DEV_DIR}/${AI_DEV_FILES.state}`, (d) => {
    if (opts.phase) d.phase = opts.phase;
  });
  place(".ai-dev/approvals.yaml", `${AI_DEV_DIR}/${AI_DEV_FILES.approvals}`);
  place("requirements.yaml", REQUIREMENTS_FILE);
  place("AI-CONTEXT.md", "AI-CONTEXT.md");

  const gitignore = join(root, ".gitignore");
  const hadGitignore = existsSync(gitignore);
  const lines = existsSync(gitignore) ? readFileSync(gitignore, "utf8").split("\n").map((l) => l.trim()) : [];
  const missing = GITIGNORE_ENTRIES.filter((e) => !lines.includes(e));
  if (missing.length) {
    const prefix = lines.length && lines.at(-1) !== "" ? "\n" : "";
    appendFileSync(gitignore, `${prefix}# Secretos (ai-dev)\n${missing.join("\n")}\n`);
    result.created.push(hadGitignore ? ".gitignore (entradas .env)" : ".gitignore");
  }

  // Un proyecto nuevo arranca con su documento de intake.
  if (!alreadyInitialized && !adopted) {
    const project = Project.at(root, cat);
    const intake = createDocument(project, "PROJECT_INTAKE", { title: `Intake ${opts.name}`, author: opts.author, now: opts.now });
    result.created.push(intake.rel);
  }
  return result;
}
