import { formatFiles } from "./format.js";
import { today } from "./ids.js";
import { nextId } from "./ids.js";
import { CliError } from "./issues.js";
import { checkPhase, requiredDeliverables } from "./phases.js";
import type { Approval, Project } from "./project.js";
import { contentHash, requirementsHash } from "./rules.js";
import { saveValidated, reviewStatus } from "./documents.js";
import type { SchemaRegistry } from "./schema.js";

export interface ApproveRequest {
  target: string;
  by: string;
  role: string;
  decision: Approval["decision"];
  comment?: string;
}

const DOC_TARGET_TYPE: Record<string, Approval["target_type"]> = { CHANGE_REQUEST: "CHANGE", RELEASE: "RELEASE" };

/** Estado resultante de cada decisión según el tipo de documento. */
const OUTCOMES: Record<string, Record<Approval["decision"], string>> = {
  ADR: { APPROVED: "ACCEPTED", REJECTED: "REJECTED", CHANGES_REQUESTED: "PROPOSED" },
  CHANGE_REQUEST: { APPROVED: "APPROVED", REJECTED: "REJECTED", CHANGES_REQUESTED: "PROPOSED" },
};
const DEFAULT_OUTCOME: Record<Approval["decision"], string> = { APPROVED: "APPROVED", REJECTED: "DRAFT", CHANGES_REQUESTED: "DRAFT" };

/**
 * Registra una decisión humana sobre una fase o un documento. Lo invoca solo `ai-dev approve`,
 * que exige una terminal interactiva: los agentes no aprueban.
 */
export function recordApproval(p: Project, registry: SchemaRegistry, cliVersion: string, req: ApproveRequest, now: Date): Approval {
  const role = p.cat.roles.roles[req.role];
  if (!role?.human_only) {
    const human = Object.entries(p.cat.roles.roles).filter(([, r]) => r.human_only).map(([id]) => id);
    throw new CliError(`El rol ${req.role} no puede aprobar. Roles aprobadores: ${human.join(", ")}.`);
  }
  if (!req.by.trim()) throw new CliError("Indica quién aprueba con --by.");
  const sod = Boolean(p.modeDef.separation_of_duties);
  const base = { id: nextId("APR", p.approvals.map((a) => a.id)), by: req.by.trim(), role: req.role, decision: req.decision, at: now.toISOString(), ...(req.comment ? { comment: req.comment } : {}) };

  let approval: Approval;
  if (req.target === "REQUIREMENTS") {
    approval = { ...base, target_type: "REQUIREMENTS", target: "REQUIREMENTS" };
    approveRequirements(p, registry, approval);
  } else if (p.cat.phases.order.includes(req.target)) {
    approval = { ...base, target_type: "PHASE", target: req.target };
    approvePhase(p, registry, cliVersion, approval, sod);
  } else {
    // Se formatea antes de calcular la huella: si el formateador cambiara el cuerpo después,
    // la aprobación quedaría desfasada nada más registrarla.
    formatFiles(p.root, [p.document(req.target).file]);
    p.invalidate();
    const doc = p.document(req.target);
    if (doc.type === "TASK") throw new CliError("Las tareas no se aprueban: se revisan al cerrarlas con `ai-dev task complete --reviewed-by`.");
    if (sod && doc.data.author === base.by) throw new CliError(`${base.by} es autor de ${doc.id}; el modo ${p.mode} exige que lo apruebe otra persona.`);
    const expected = reviewStatus(doc.type);
    if (doc.data.status !== expected) throw new CliError(`${doc.id} está en ${String(doc.data.status)}; envíalo antes a revisión con \`ai-dev submit ${doc.id}\`.`);

    doc.data.status = (OUTCOMES[doc.type] ?? DEFAULT_OUTCOME)[req.decision];
    doc.data.updated_at = today(now);
    if (req.decision === "APPROVED") {
      doc.data.approved_by = base.by;
      doc.data.approved_at = today(now);
    }
    approval = {
      ...base,
      target_type: DOC_TARGET_TYPE[doc.type] ?? "DOCUMENT",
      target: doc.id,
      target_version: String(doc.data.version),
      ...(req.decision === "APPROVED" ? { target_hash: contentHash(doc) } : {}),
    };
    saveValidated(p, registry, doc);
  }

  const check = registry.validate("approvals", { approvals: [...p.approvals, approval] });
  if (!check.valid) throw new CliError(`Aprobación inválida: ${check.errors.join("; ")}`);
  p.appendApproval(approval);
  return approval;
}

function approvePhase(p: Project, registry: SchemaRegistry, cliVersion: string, approval: Approval, sod: boolean): void {
  const phase = approval.target;
  if (p.state.phase !== phase) throw new CliError(`Solo se aprueba la fase actual (${p.state.phase}).`);
  const def = p.cat.phases.phases[phase]!;
  const dual = ((p.modeDef as { dual_approval_phases?: string[] }).dual_approval_phases ?? []).includes(phase);
  const allowed = approval.role === def.approver || (dual && approval.role === "SECURITY_OFFICER");
  if (!allowed) throw new CliError(`La fase ${phase} la aprueba ${def.approver}${dual ? " (o SECURITY_OFFICER como segundo aprobador)" : ""}, no ${approval.role}.`);

  if (approval.decision === "APPROVED") {
    const check = checkPhase(p, registry, cliVersion, phase);
    const failing = check.items.filter((i) => !i.ok && i.kind !== "APPROVAL");
    if (failing.length) throw new CliError(`La fase ${phase} aún no está lista:\n${failing.map((i) => `  - ${i.kind} ${i.name}: ${i.detail}`).join("\n")}`);
    if (sod) {
      const types = new Set(requiredDeliverables(p, phase).map((d) => d.type));
      const authored = p.documents().filter((d) => types.has(d.type) && d.data.author === approval.by);
      if (authored.length) throw new CliError(`${approval.by} es autor de ${authored.map((d) => d.id).join(", ")}; el modo ${p.mode} exige otro aprobador.`);
    }
  }
}

/** Decide sobre los requisitos PROPOSED y fija la huella de los aprobados. Solo PRODUCT_OWNER. */
function approveRequirements(p: Project, registry: SchemaRegistry, approval: Approval): void {
  const approver = p.cat.phases.phases.DEFINITION?.approver ?? "PRODUCT_OWNER";
  if (approval.role !== approver) throw new CliError(`Los requisitos los aprueba ${approver}, no ${approval.role}.`);
  const file = p.requirementsFile();
  if (!file?.requirements?.length) throw new CliError("requirements.yaml no tiene requisitos que aprobar.");
  const next: Record<Approval["decision"], string | null> = { APPROVED: "APPROVED", REJECTED: "REJECTED", CHANGES_REQUESTED: null };
  const to = next[approval.decision];
  if (to) for (const r of file.requirements) if (r.status === "PROPOSED") r.status = to;
  const check = registry.validate("requirements", file);
  if (!check.valid) throw new CliError(`requirements.yaml es inválido:\n  ${check.errors.join("\n  ")}`);
  if (approval.decision === "APPROVED") approval.target_hash = requirementsHash(file.requirements);
  if (to) p.saveRequirements(file);
}
