import { execSync } from "node:child_process";
import { commits, isGitRepo } from "./git.js";
import { today } from "./ids.js";
import { CliError, error, info, warning, type Issue } from "./issues.js";
import type { DocumentRecord, Project } from "./project.js";
import { isRequirementApproved, taskTerminal } from "./rules.js";
import { schemaForDocumentType, type SchemaRegistry } from "./schema.js";
import { missingEvidence } from "./validate.js";
import { saveValidated } from "./documents.js";

const AI_EXECUTORS = new Set(["LLM", "AGENT"]);

export function allowedTransitions(p: Project, from: string): string[] {
  return (p.cat.states.task_status as { transitions: Record<string, string[]> }).transitions[from] ?? [];
}

export function assertTransition(p: Project, task: DocumentRecord, to: string): void {
  const from = String(task.data.status);
  if (!allowedTransitions(p, from).includes(to)) {
    const allowed = allowedTransitions(p, from);
    throw new CliError(`${task.id}: no se puede pasar de ${from} a ${to}. Desde ${from} se permite: ${allowed.join(", ") || "ninguna (estado final)"}.`);
  }
}

/** Definition of Ready: criterios automatizables de catalog/definitions.yaml. */
export function checkReady(p: Project, registry: SchemaRegistry, task: DocumentRecord, opts: { ignoreDependencies?: boolean } = {}): Issue[] {
  const issues: Issue[] = registry
    .validate(schemaForDocumentType(p.cat, "TASK"), task.data)
    .errors.map((e) => error("dor_schema", `Campos incompletos o inválidos: ${e}`, task.rel));

  for (const field of ["objective", "justification"] as const) {
    if (task.data[field] === "UNKNOWN") issues.push(error("dor_unknown", `${field} sigue en UNKNOWN.`, task.rel));
  }
  for (const ac of (task.data.acceptance_criteria as { id: string; description: string }[] | undefined) ?? []) {
    if (!ac.description || ac.description === "UNKNOWN") issues.push(error("dor_criteria", `El criterio ${ac.id} no está definido.`, task.rel));
  }

  const reqs = new Map(p.requirements().map((r) => [r.id, r]));
  for (const rel of (task.data.relations as { type: string; target: string }[] | undefined) ?? []) {
    if (rel.type !== "IMPLEMENTS") continue;
    const req = reqs.get(rel.target);
    if (!req) issues.push(error("dor_requirement", `Implementa ${rel.target}, que no existe en requirements.yaml.`, task.rel));
    else if (!isRequirementApproved(req.status)) issues.push(error("dor_requirement", `Implementa ${rel.target}, que está ${req.status} (debe estar APPROVED).`, task.rel));
  }

  if (!opts.ignoreDependencies) {
    for (const dep of (task.data.blocked_by as string[] | undefined) ?? []) {
      const other = p.tasks().find((t) => t.id === dep);
      if (other && other.data.status !== "COMPLETED") issues.push(error("dor_dependency", `Depende de ${dep}, que está ${String(other.data.status)}.`, task.rel));
    }
  }
  return issues;
}

export interface GateResult {
  gate: string;
  result: "PASS" | "FAIL" | "MANUAL";
  command?: string;
}

/** Gates de DEVELOPMENT exigidos por el modo, ejecutando los comandos configurados en el proyecto. */
export function runGates(p: Project): GateResult[] {
  const required = new Set(p.modeDef.gates_required);
  const gates = (p.cat.phases.phases.DEVELOPMENT?.gates ?? []).filter((g) => required.has(g));
  const commands = p.configuration.gate_commands ?? {};
  return gates.map((gate) => {
    const command = commands[gate];
    if (!command) return { gate, result: "MANUAL" };
    try {
      execSync(command, { cwd: p.root, stdio: "pipe" });
      return { gate, result: "PASS", command };
    } catch {
      return { gate, result: "FAIL", command };
    }
  });
}

/** Definition of Done: criterios automatizables. */
export function checkDone(p: Project, task: DocumentRecord, gates: GateResult[]): Issue[] {
  const issues: Issue[] = [];
  for (const ac of missingEvidence(task.data)) {
    issues.push(error("dod_evidence", `Falta evidencia para ${ac}. Usa \`ai-dev task evidence ${task.id} --criterion ${ac} ...\`.`, task.rel));
  }
  for (const g of gates) {
    if (g.result === "FAIL") issues.push(error("dod_gate", `El gate ${g.gate} falla (\`${g.command}\`).`, task.rel));
    if (g.result === "MANUAL") issues.push(warning("dod_gate_manual", `El gate ${g.gate} no tiene comando configurado: verifícalo manualmente.`, task.rel));
  }
  if (AI_EXECUTORS.has(String(task.data.executor)) && !task.data.provenance) {
    issues.push(error("dod_provenance", "La tarea la ejecutó IA y no registra provenance (generated_by, model…).", task.rel));
  }
  if (p.modeDef.separation_of_duties) {
    const reviewer = task.data.reviewed_by as string | null | undefined;
    if (!reviewer) issues.push(error("dod_review", `El modo ${p.mode} exige revisión: indica --reviewed-by.`, task.rel));
    else if (reviewer === task.data.assignee || reviewer === task.data.author) {
      issues.push(error("dod_review", `${reviewer} no puede revisar su propio trabajo.`, task.rel));
    }
  }
  if (isGitRepo(p.root)) {
    if (!commits(p.root).some((c) => c.tasks.includes(task.id))) {
      issues.push(error("dod_commits", `Ningún commit incluye el trailer "Task: ${task.id}".`, task.rel));
    }
  } else {
    issues.push(warning("dod_no_git", "El proyecto no usa Git: no se puede comprobar la trazabilidad de commits.", task.rel));
  }
  if (!issues.length) issues.push(info("dod_ok", "Definition of Done cumplida."));
  return issues;
}

export interface MoveOptions {
  now: Date;
  blockedBy?: string[];
  reason?: string;
  reviewedBy?: string;
}

/** Cambia el estado de una tarea aplicando la máquina de estados, DoR y DoD. Devuelve los avisos. */
export function moveTask(p: Project, registry: SchemaRegistry, id: string, to: string, opts: MoveOptions): Issue[] {
  const task = p.document(id);
  if (task.type !== "TASK") throw new CliError(`${id} no es una tarea.`);
  assertTransition(p, task, to);
  let issues: Issue[] = [];

  if (to === "READY") {
    issues = checkReady(p, registry, task);
    if (issues.some((i) => i.level === "ERROR")) throw new CliError(`${id} no cumple la Definition of Ready:\n${formatList(issues)}`);
  }
  if (to === "BLOCKED") {
    if (!opts.blockedBy?.length && !opts.reason) throw new CliError("Indica qué bloquea la tarea: --by TASK-NNN o --reason \"...\".");
    if (opts.blockedBy?.length) task.data.blocked_by = [...new Set([...((task.data.blocked_by as string[]) ?? []), ...opts.blockedBy])];
  }
  if (to === "COMPLETED") {
    if (opts.reviewedBy) task.data.reviewed_by = opts.reviewedBy;
    issues = checkDone(p, task, runGates(p));
    if (issues.some((i) => i.level === "ERROR")) throw new CliError(`${id} no cumple la Definition of Done:\n${formatList(issues)}`);
  }
  if ((to === "CANCELLED" || to === "FAILED") && !opts.reason) throw new CliError(`Indica el motivo con --reason para pasar a ${to}.`);

  task.data.status = to;
  task.data.updated_at = today(opts.now);
  if (opts.reason) task.content = `${task.content.trimEnd()}\n\n> ${today(opts.now)} — ${to}: ${opts.reason}\n`;
  saveValidated(p, registry, task);

  const state = p.state;
  if (to === "IN_PROGRESS") p.saveState({ current_task: id }, opts.now);
  else if (state.current_task === id && taskTerminal(p.cat, to)) p.saveState({ current_task: null }, opts.now);
  return issues;
}

/** Registra un intento automático de corrección; al llegar al límite la tarea pasa a REQUIRES_REVIEW. */
export function recordAttempt(p: Project, registry: SchemaRegistry, id: string, now: Date, note?: string): { attempts: number; limit: number; escalated: boolean } {
  const task = p.document(id);
  if (task.data.status !== "IN_PROGRESS") throw new CliError(`${id} debe estar IN_PROGRESS para registrar intentos (está ${String(task.data.status)}).`);
  const limit = p.limit("max_auto_fix_attempts");
  const attempts = Number(task.data.auto_fix_attempts ?? 0) + 1;
  task.data.auto_fix_attempts = attempts;
  task.data.updated_at = today(now);
  task.content = `${task.content.trimEnd()}\n\n> ${today(now)} — intento automático ${attempts}/${limit}${note ? `: ${note}` : ""}\n`;
  const escalated = attempts >= limit;
  if (escalated) task.data.status = "REQUIRES_REVIEW";
  saveValidated(p, registry, task);
  return { attempts, limit, escalated };
}

export function addEvidence(
  p: Project,
  registry: SchemaRegistry,
  id: string,
  evidence: { criterion: string; type: string; ref: string },
  now: Date,
): void {
  const task = p.document(id);
  const criteria = ((task.data.acceptance_criteria as { id: string }[] | undefined) ?? []).map((c) => c.id);
  if (!criteria.includes(evidence.criterion)) throw new CliError(`${id} no tiene el criterio ${evidence.criterion}. Criterios: ${criteria.join(", ")}.`);
  task.data.evidence = [...((task.data.evidence as unknown[]) ?? []), { ...evidence, recorded_at: today(now) }];
  task.data.updated_at = today(now);
  saveValidated(p, registry, task);
}

export function formatList(issues: Issue[]): string {
  return issues.map((i) => `  - ${i.message}`).join("\n");
}
