import { existsSync, readFileSync } from "node:fs";
import { adapterStatus } from "./adapters.js";
import { AI_DEV_DIR, AI_DEV_FILES, REQUIREMENTS_FILE, type AiDevFile, type Project } from "./project.js";
import { error, info, warning, type Issue } from "./issues.js";
import { hashMatches, isApproved, isRequirementApproved, latestApproval, latestApproved, requirementsHash } from "./rules.js";
import { schemaForDocumentType, type SchemaRegistry } from "./schema.js";
import { readYaml } from "./yaml.js";

const AI_DEV_SCHEMAS: Record<AiDevFile, string> = {
  methodology: "ai-dev-methodology",
  configuration: "ai-dev-configuration",
  policies: "ai-dev-policies",
  state: "ai-dev-state",
  approvals: "approvals",
};

/** Validación estructural del proyecto: esquemas, coherencia interna y aprobaciones. No construye el grafo de trazabilidad. */
export function validateProject(p: Project, registry: SchemaRegistry, cliVersion: string): Issue[] {
  const issues: Issue[] = [];

  // .ai-dev/
  let aiDevValid = true;
  for (const [file, schema] of Object.entries(AI_DEV_SCHEMAS) as [AiDevFile, string][]) {
    const rel = `${AI_DEV_DIR}/${AI_DEV_FILES[file]}`;
    if (!p.hasAiDev(file)) {
      issues.push(error("missing_file", `Falta ${rel}. Ejecuta \`ai-dev init\` para completarlo.`, rel));
      aiDevValid = false;
      continue;
    }
    for (const e of registry.validate(schema, readYaml(p.aiDevPath(file))).errors) {
      issues.push(error("schema", e, rel));
      aiDevValid = false;
    }
  }
  if (!aiDevValid) return issues;

  const methodology = p.methodology;
  const config = p.configuration;
  const state = p.state;

  if (methodology.methodology.version !== cliVersion) {
    issues.push(
      warning("version_mismatch", `El proyecto fija la metodología ${methodology.methodology.version} y la CLI es ${cliVersion}. Ver \`ai-dev doctor\`.`, ".ai-dev/methodology.yaml"),
    );
  }

  for (const [name, value] of Object.entries(config.limits ?? {})) {
    const base = Number(p.cat.limits[name]);
    if (value > base) issues.push(error("limit_relaxed", `El límite ${name}=${value} supera el del catálogo (${base}); los proyectos solo pueden reducirlo.`, ".ai-dev/configuration.yaml"));
  }

  const providers = new Set((config.providers ?? []).map((pr) => pr.name));
  const maxAutonomy = p.modeDef.max_autonomy_level;
  for (const agent of config.agents ?? []) {
    if (!providers.has(agent.provider)) issues.push(error("unknown_provider", `El agente ${agent.agent_id} usa el proveedor ${agent.provider}, que no está en providers.`, ".ai-dev/configuration.yaml"));
    if (agent.max_autonomy_level > maxAutonomy) {
      issues.push(error("autonomy_exceeded", `El agente ${agent.agent_id} tiene autonomía ${agent.max_autonomy_level}; el modo ${p.mode} permite como máximo ${maxAutonomy}.`, ".ai-dev/configuration.yaml"));
    }
  }

  // Requisitos
  const reqFile = p.path(REQUIREMENTS_FILE);
  if (existsSync(reqFile)) {
    const result = registry.validate("requirements", readYaml(reqFile));
    result.errors.forEach((e) => issues.push(error("schema", e, REQUIREMENTS_FILE)));
    if (result.valid) {
      const reqs = p.requirements();
      duplicates(reqs.map((r) => r.id)).forEach((id) => issues.push(error("duplicate_id", `Requisito duplicado: ${id}`, REQUIREMENTS_FILE)));
      const problem = requirementsApprovalProblem(p);
      if (problem) issues.push(error("requirements_approval", problem, REQUIREMENTS_FILE));
    }
  }

  // Documentos
  const docs = p.documents();
  const types = p.cat.documentTypes.types;
  duplicates(docs.map((d) => d.id)).forEach((id) => issues.push(error("duplicate_id", `ID duplicado: ${id} (${docs.filter((d) => d.id === id).map((d) => d.rel).join(", ")})`)));

  for (const doc of docs) {
    const def = types[doc.type];
    if (!def) {
      issues.push(error("unknown_type", `Tipo de documento desconocido: ${doc.type || "(vacío)"}`, doc.rel));
      continue;
    }
    for (const e of registry.validate(schemaForDocumentType(p.cat, doc.type), doc.data).errors) issues.push(error("schema", e, doc.rel));
    if (!doc.id.startsWith(`${def.id_prefix}-`)) issues.push(error("id_prefix", `El ID ${doc.id} no usa el prefijo ${def.id_prefix} de ${doc.type}.`, doc.rel));
    const folder = p.folderFor(doc.type);
    const prefix = folder ? `docs/${folder}/` : "docs/";
    if (!doc.rel.startsWith(prefix)) issues.push(warning("folder", `${doc.type} debería estar en ${prefix} (o declara su carpeta en document_folders).`, doc.rel));
    if (doc.data.project !== methodology.project.id) issues.push(error("project_mismatch", `El documento declara project=${String(doc.data.project)}, pero el proyecto es ${methodology.project.id}.`, doc.rel));

    if (isApproved(doc)) {
      const approval = latestApproval(p, doc.id);
      if (!approval || approval.decision !== "APPROVED") {
        issues.push(error("approval_missing", `${doc.id} figura como ${String(doc.data.status)} sin aprobación registrada. Usa \`ai-dev approve ${doc.id}\`.`, doc.rel));
      } else if (approval.target_hash && !hashMatches(doc, approval.target_hash)) {
        issues.push(error("modified_after_approval", `${doc.id} cambió después de aprobarse. Usa \`ai-dev revise ${doc.id}\` y vuelve a aprobarlo.`, doc.rel));
      }
    }
  }

  // Tareas
  const ids = p.knownIds();
  const tasks = p.tasks();
  const limit = p.limit("max_auto_fix_attempts");
  for (const task of tasks) {
    const d = task.data;
    for (const dep of (d.blocked_by as string[] | undefined) ?? []) {
      if (!ids.has(dep)) issues.push(error("broken_dependency", `${task.id} depende de ${dep}, que no existe.`, task.rel));
    }
    if (d.status === "BLOCKED" && !((d.blocked_by as string[] | undefined) ?? []).length) {
      issues.push(warning("blocked_without_reason", `${task.id} está BLOCKED sin blocked_by; indica la dependencia o el motivo en las notas.`, task.rel));
    }
    if (Number(d.auto_fix_attempts ?? 0) > limit) issues.push(error("retries_exceeded", `${task.id} supera el límite de ${limit} correcciones automáticas.`, task.rel));
    if (d.status === "COMPLETED") {
      for (const ac of missingEvidence(task.data)) issues.push(error("evidence_missing", `${task.id} está COMPLETED sin evidencia para ${ac}.`, task.rel));
    }
  }
  if (state.current_task && !tasks.some((t) => t.id === state.current_task)) {
    issues.push(error("unknown_task", `state.current_task apunta a ${state.current_task}, que no existe.`, ".ai-dev/state.yaml"));
  }

  // Archivos de soporte
  const aiContext = p.path("AI-CONTEXT.md");
  if (!existsSync(aiContext)) {
    issues.push(warning("missing_ai_context", "Falta AI-CONTEXT.md, el resumen que leen los agentes al empezar."));
  } else {
    const lines = readFileSync(aiContext, "utf8").split("\n").length;
    const max = p.limit("max_ai_context_md_lines");
    if (lines > max) issues.push(warning("ai_context_too_long", `AI-CONTEXT.md tiene ${lines} líneas (máximo ${max}); resume y referencia documentos.`, "AI-CONTEXT.md"));
  }
  for (const a of adapterStatus(p).filter((a) => a.status !== "UP_TO_DATE")) {
    const fix = a.status === "MODIFIED" ? "Editaron el bloque generado; muévelo fuera del bloque o usa `ai-dev adapters sync --force`." : "Ejecuta `ai-dev adapters sync`.";
    issues.push((a.status === "INVALID" ? error : warning)(`adapter_${a.status.toLowerCase()}`, `Adaptador ${a.adapter}: ${a.target} está ${a.status}. ${fix}`, a.target));
  }
  if (!envIgnored(p)) issues.push(warning("env_not_ignored", "El .gitignore no excluye .env: riesgo de subir secretos.", ".gitignore"));

  if (!issues.length) issues.push(info("ok", `Proyecto válido: ${plural(docs.length, "documento")}, ${plural(p.requirements().length, "requisito")}.`));
  return issues;
}

export function missingEvidence(task: Record<string, unknown>): string[] {
  const criteria = ((task.acceptance_criteria as { id: string }[] | undefined) ?? []).map((c) => c.id);
  const covered = new Set(((task.evidence as { criterion: string }[] | undefined) ?? []).map((e) => e.criterion));
  return criteria.filter((c) => !covered.has(c));
}

export function envIgnored(p: Project): boolean {
  const gitignore = p.path(".gitignore");
  return existsSync(gitignore) && readFileSync(gitignore, "utf8").split("\n").some((l) => /^\/?\.env(\*|\.\*)?$/.test(l.trim()));
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  return [...new Set(values.filter((v) => (seen.has(v) ? true : (seen.add(v), false))))];
}

/** Requisitos aprobados sin aprobación registrada o modificados después de aprobarse. */
export function requirementsApprovalProblem(p: Project): string | null {
  const reqs = p.requirements();
  if (!reqs.some((r) => isRequirementApproved(r.status))) return null;
  const approval = latestApproved(p, "REQUIREMENTS");
  if (!approval) return "Hay requisitos aprobados sin aprobación registrada. Un responsable debe ejecutar `ai-dev approve REQUIREMENTS`.";
  if (approval.target_hash !== requirementsHash(reqs)) {
    return "Los requisitos aprobados cambiaron después de su aprobación. Un responsable debe volver a ejecutar `ai-dev approve REQUIREMENTS`.";
  }
  return null;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
