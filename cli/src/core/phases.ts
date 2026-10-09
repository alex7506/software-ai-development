import { adapterStatus } from "./adapters.js";
import { isGitRepo } from "./git.js";
import { CliError, hasErrors } from "./issues.js";
import type { Project } from "./project.js";
import { isApproved, isRequirementApproved, modeIndex, phaseIndex, taskTerminal } from "./rules.js";
import type { SchemaRegistry } from "./schema.js";
import { checkReady } from "./tasks.js";
import { traceProject } from "./trace.js";
import { envIgnored, requirementsApprovalProblem, validateProject } from "./validate.js";

export interface CheckItem {
  kind: "DELIVERABLE" | "CHECK" | "GATE" | "APPROVAL";
  name: string;
  ok: boolean;
  detail: string;
}

export interface PhaseCheck {
  phase: string;
  items: CheckItem[];
  /** Entregables, checks y gates cumplidos (sin contar la aprobación). */
  ready: boolean;
  approved: boolean;
}

export function requiredDeliverables(p: Project, phase: string) {
  const def = p.cat.phases.phases[phase];
  if (!def) throw new CliError(`Fase desconocida: ${phase}`);
  const mode = modeIndex(p.cat, p.mode);
  const base = (def.deliverables ?? []).filter(
    (d) => modeIndex(p.cat, d.min_mode) <= mode && (!d.when || (d.when !== "on_change" && p.feature(d.when))),
  );
  // Entregables que el proyecto exige además de los de su modo (configuration.yaml#additional_deliverables).
  const extra = (p.configuration.additional_deliverables ?? [])
    .filter((d) => d.phase === phase && !base.some((b) => b.type === d.type))
    .map((d) => ({ type: d.type, min_mode: p.mode }));
  return [...base, ...extra];
}

export function checkPhase(p: Project, registry: SchemaRegistry, cliVersion: string, phase = p.state.phase): PhaseCheck {
  const def = p.cat.phases.phases[phase];
  if (!def) throw new CliError(`Fase desconocida: ${phase}`);
  const items: CheckItem[] = [];
  const docs = p.documents();

  for (const d of requiredDeliverables(p, phase)) {
    items.push({ kind: "DELIVERABLE", name: d.type, ...deliverableStatus(p, registry, d.type, docs) });
  }

  for (const check of (def as { checks?: string[] }).checks ?? []) {
    items.push({ kind: "CHECK", name: check, ...runCheck(p, registry, cliVersion, check) });
  }

  const required = new Set(p.modeDef.gates_required);
  for (const gate of (def.gates ?? []).filter((g) => required.has(g))) {
    items.push({ kind: "GATE", name: gate, ...gateStatus(p, gate) });
  }

  const ready = items.every((i) => i.ok);
  const approval = phaseApproval(p, phase);
  items.push({ kind: "APPROVAL", name: def.approver, ok: approval.ok, detail: approval.detail });
  return { phase, items, ready, approved: approval.ok };
}

function deliverableStatus(p: Project, registry: SchemaRegistry, type: string, docs: ReturnType<Project["documents"]>): Omit<CheckItem, "kind" | "name"> {
  if (type === "REQUIREMENTS") {
    const reqs = p.requirements();
    if (!reqs.length) return { ok: false, detail: "requirements.yaml no tiene requisitos." };
    const pending = reqs.filter((r) => r.status === "PROPOSED").map((r) => r.id);
    if (pending.length) return { ok: false, detail: `Requisitos sin decidir (PROPOSED): ${pending.join(", ")}. Se aprueban con \`ai-dev approve REQUIREMENTS\`.` };
    const problem = requirementsApprovalProblem(p);
    return problem ? { ok: false, detail: problem } : { ok: true, detail: `${reqs.filter((r) => isRequirementApproved(r.status)).length} requisitos aprobados.` };
  }
  if (type === "TECHNOLOGY_PROFILE") {
    const profile = p.methodology.technology_profile;
    return profile ? { ok: true, detail: `Perfil: ${profile}.` } : { ok: false, detail: "Declara technology_profile en .ai-dev/methodology.yaml." };
  }
  if (type === "TASK") {
    const tasks = p.tasks();
    if (!tasks.length) return { ok: false, detail: "No hay tareas." };
    const notReady = tasks.filter((t) => !taskTerminal(p.cat, String(t.data.status)) && hasErrors(checkReady(p, registry, t, { ignoreDependencies: true })));
    const covered = new Set(tasks.flatMap((t) => ((t.data.relations as { type: string; target: string }[]) ?? []).filter((r) => r.type === "IMPLEMENTS").map((r) => r.target)));
    const uncovered = p.requirements().filter((r) => isRequirementApproved(r.status) && r.baseline !== true && !covered.has(r.id)).map((r) => r.id);
    const problems = [
      notReady.length ? `sin Definition of Ready: ${notReady.map((t) => t.id).join(", ")}` : "",
      uncovered.length ? `requisitos sin tarea: ${uncovered.join(", ")}` : "",
    ].filter(Boolean);
    return problems.length ? { ok: false, detail: `${problems.join("; ")}.` } : { ok: true, detail: `${tasks.length} tareas listas.` };
  }

  const ofType = docs.filter((d) => d.type === type);
  if (!ofType.length) return { ok: false, detail: `No existe. Créalo con \`ai-dev new ${type}\`.` };
  const approved = ofType.filter(isApproved);
  if (!approved.length) return { ok: false, detail: `${ofType.map((d) => `${d.id} (${String(d.data.status)})`).join(", ")}: ninguno aprobado.` };
  if (type === "VALIDATION_REPORT") {
    const passing = approved.filter((d) => ["APPROVED", "APPROVED_WITH_WARNINGS"].includes(String(d.data.outcome)));
    if (!passing.length) return { ok: false, detail: "Ningún informe aprobado tiene resultado APPROVED o APPROVED_WITH_WARNINGS." };
  }
  if (type === "RELEASE" && !approved.some((d) => d.data.rollback_verified === true)) {
    return { ok: false, detail: "Ninguna release aprobada tiene el rollback verificado." };
  }
  return { ok: true, detail: approved.map((d) => d.id).join(", ") };
}

function runCheck(p: Project, registry: SchemaRegistry, cliVersion: string, check: string): Omit<CheckItem, "kind" | "name"> {
  switch (check) {
    case "git_initialized":
      return isGitRepo(p.root) ? { ok: true, detail: "Repositorio Git presente." } : { ok: false, detail: "Inicializa Git (`git init`)." };
    case "ai_dev_valid": {
      const errors = validateProject(p, registry, cliVersion).filter((i) => i.level === "ERROR");
      return errors.length ? { ok: false, detail: `${errors.length} errores en \`ai-dev validate\`.` } : { ok: true, detail: "`ai-dev validate` sin errores." };
    }
    case "adapters_generated": {
      const pending = adapterStatus(p).filter((a) => a.status !== "UP_TO_DATE");
      return pending.length
        ? { ok: false, detail: `Adaptadores pendientes: ${pending.map((a) => `${a.target} (${a.status})`).join(", ")}. Ejecuta \`ai-dev adapters sync\`.` }
        : { ok: true, detail: "Adaptadores generados y al día." };
    }
    case "secrets_excluded":
      return envIgnored(p) ? { ok: true, detail: ".env excluido en .gitignore." } : { ok: false, detail: "Añade .env al .gitignore." };
    case "planned_tasks_closed": {
      const open = p.tasks().filter((t) => !taskTerminal(p.cat, String(t.data.status)));
      return open.length ? { ok: false, detail: `Tareas abiertas: ${open.map((t) => t.id).join(", ")}.` } : { ok: true, detail: "Todas las tareas cerradas." };
    }
    default:
      return { ok: false, detail: `Check desconocido: ${check}.` };
  }
}

function gateStatus(p: Project, gate: string): Omit<CheckItem, "kind" | "name"> {
  if (gate === "TRACEABILITY") {
    const t = traceProject(p);
    return { ok: t.meetsMinimum, detail: `Integridad ${t.status} (mínimo ${t.minimum}).` };
  }
  if (["CODE", "BUILD", "TEST", "SECURITY"].includes(gate)) {
    return { ok: true, detail: "Verificado al cerrar cada tarea (`ai-dev task complete`)." };
  }
  return { ok: true, detail: "Cubierto por los entregables de la fase." };
}

/** La fase está aprobada si, desde que empezó, la última decisión es APPROVED y hay suficientes aprobadores distintos. */
export function phaseApproval(p: Project, phase: string): { ok: boolean; detail: string } {
  const since = p.state.phase === phase ? p.state.phase_started_at : undefined;
  const records = p.approvals.filter((a) => a.target_type === "PHASE" && a.target === phase && (!since || a.at >= since));
  const latest = records.at(-1);
  if (!latest) return { ok: false, detail: "Sin aprobación. Un responsable humano debe ejecutar `ai-dev approve " + phase + "`." };
  if (latest.decision !== "APPROVED") return { ok: false, detail: `Última decisión: ${latest.decision} por ${latest.by}.` };
  const approvers = new Set(records.filter((a) => a.decision === "APPROVED").map((a) => a.by));
  const needed = requiredApprovers(p, phase);
  if (approvers.size < needed) return { ok: false, detail: `Aprobada por ${[...approvers].join(", ")}; el modo ${p.mode} exige ${needed} personas distintas.` };
  return { ok: true, detail: `Aprobada por ${[...approvers].join(", ")}.` };
}

export function requiredApprovers(p: Project, phase: string): number {
  const dual = (p.modeDef as { dual_approval_phases?: string[] }).dual_approval_phases ?? [];
  return dual.includes(phase) ? 2 : 1;
}

export function nextPhase(p: Project, phase: string): string | null {
  return p.cat.phases.order[phaseIndex(p.cat, phase) + 1] ?? null;
}

/** Avanza a la siguiente fase si la actual está lista y aprobada. */
export function advancePhase(p: Project, registry: SchemaRegistry, cliVersion: string, now: Date): { from: string; to: string } {
  const from = p.state.phase;
  const to = nextPhase(p, from);
  if (!to) throw new CliError(`${from} es la última fase. Los cambios reingresan al ciclo con \`ai-dev phase reenter --change CHANGE-NNN\`.`);
  const check = checkPhase(p, registry, cliVersion, from);
  const failing = check.items.filter((i) => !i.ok);
  if (failing.length) throw new CliError(`No se puede avanzar de ${from}:\n${failing.map((i) => `  - ${i.kind} ${i.name}: ${i.detail}`).join("\n")}`);
  p.saveState({ phase: to, status: "ACTIVE", phase_started_at: now.toISOString() }, now);
  return { from, to };
}

/** Reingresa al ciclo en la fase indicada por una solicitud de cambio aprobada. */
export function reenterPhase(p: Project, changeId: string, now: Date): { from: string; to: string } {
  const change = p.document(changeId);
  if (change.type !== "CHANGE_REQUEST") throw new CliError(`${changeId} no es una solicitud de cambio.`);
  if (!isApproved(change)) throw new CliError(`${changeId} no está aprobada (estado ${String(change.data.status)}).`);
  const to = String(change.data.reentry_phase);
  const from = p.state.phase;
  if (from !== "EVOLUTION") throw new CliError(`Solo se reingresa al ciclo desde EVOLUTION (fase actual: ${from}).`);
  if (change.data.status !== "APPROVED") throw new CliError(`${changeId} ya se aplicó (estado ${String(change.data.status)}).`);
  p.saveState({ phase: to, status: "ACTIVE", phase_started_at: now.toISOString() }, now);
  // El cambio pasa a implementación: el estado no forma parte de la huella aprobada.
  change.data.status = "IMPLEMENTING";
  p.saveDocument(change);
  return { from, to };
}

/**
 * Cambia el modo de rigor. Solo mientras no exista ninguna aprobación: después, el modo forma parte
 * de lo aprobado y cambiarlo es una solicitud de cambio.
 */
export function setMode(p: Project, mode: string): { from: string; to: string } {
  if (!p.cat.modes.order.includes(mode)) throw new CliError(`Modo desconocido: ${mode}. Usa ${p.cat.modes.order.join(", ")}.`);
  const from = p.mode;
  if (from === mode) throw new CliError(`El proyecto ya está en modo ${mode}.`);
  if (p.approvals.length) {
    throw new CliError(`El proyecto ya tiene ${p.approvals.length} aprobaciones: cambiar el modo requiere una solicitud de cambio (ai-dev new CHANGE_REQUEST).`);
  }
  p.writeAiDev("methodology", { ...p.methodology, mode });
  return { from, to: mode };
}
