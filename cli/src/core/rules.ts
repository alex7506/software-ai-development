import { createHash } from "node:crypto";
import type { Catalog } from "./catalog.js";
import type { DocumentRecord, Project } from "./project.js";

/** Estados que equivalen a "aprobado" según el tipo de documento. */
const APPROVED_STATUSES: Record<string, string[]> = {
  ADR: ["ACCEPTED"],
  CHANGE_REQUEST: ["APPROVED", "IMPLEMENTING", "VALIDATING", "DONE"],
  TASK: [],
};
const DEFAULT_APPROVED = ["APPROVED"];

export function isApproved(doc: DocumentRecord): boolean {
  return (APPROVED_STATUSES[doc.type] ?? DEFAULT_APPROVED).includes(String(doc.data.status));
}

export const isRequirementApproved = (status: string) => ["APPROVED", "IMPLEMENTED", "VERIFIED"].includes(status);

/** Campos que cambian al aprobar, revisar o publicar y no forman parte del contenido aprobado. */
const VOLATILE_FIELDS = new Set(["status", "approved_by", "approved_at", "updated_at", "released_at"]);
/** Campos excluidos por la huella de la metodología 0.9.0 (antes de excluir `released_at`). */
const VOLATILE_FIELDS_0_9 = new Set(["status", "approved_by", "approved_at", "updated_at"]);

type Hashable = { data: Record<string, unknown>; content: string };

function hashWith(doc: Hashable, volatile: Set<string>): string {
  const stable = Object.fromEntries(
    Object.entries(doc.data)
      .filter(([k]) => !volatile.has(k))
      .sort(([a], [b]) => a.localeCompare(b)),
  );
  return createHash("sha256").update(JSON.stringify(stable)).update("\0").update(doc.content.trim()).digest("hex").slice(0, 16);
}

/** Huella del contenido de un documento: detecta ediciones posteriores a su aprobación. */
export function contentHash(doc: Hashable): string {
  return hashWith(doc, VOLATILE_FIELDS);
}

/** ¿Coincide la huella aprobada con el documento? Acepta también huellas de la 0.9.0 para no invalidar aprobaciones existentes. */
export function hashMatches(doc: Hashable, approvedHash: string): boolean {
  return approvedHash === contentHash(doc) || approvedHash === hashWith(doc, VOLATILE_FIELDS_0_9);
}

export function phaseIndex(cat: Catalog, phase: string): number {
  return cat.phases.order.indexOf(phase);
}

export function modeIndex(cat: Catalog, mode: string): number {
  return cat.modes.order.indexOf(mode);
}

export function integrityIndex(cat: Catalog, status: string): number {
  return (cat.states.integrity_status?.values ?? []).indexOf(status);
}

export function worstIntegrity(cat: Catalog, statuses: string[]): string {
  const order = cat.states.integrity_status?.values ?? [];
  return statuses.reduce((worst, s) => (order.indexOf(s) > order.indexOf(worst) ? s : worst), order[0] ?? "INTEGRITY_OK");
}

export function taskTerminal(cat: Catalog, status: string): boolean {
  return ((cat.states.task_status as { terminal?: string[] }).terminal ?? []).includes(status);
}

/** Última aprobación registrada para un objetivo (decisión más reciente). */
export function latestApproval(project: Project, target: string, since?: string | null) {
  return project.approvals
    .filter((a) => a.target === target && (!since || a.at >= since))
    .sort((a, b) => a.at.localeCompare(b.at))
    .at(-1);
}

/** Huella de los requisitos aprobados (sin su estado): detecta cambios de contenido tras aprobarlos. */
export function requirementsHash(requirements: { id: string; status: string }[]): string {
  const approved = requirements
    .filter((r) => isRequirementApproved(r.status))
    .map(({ status: _status, ...rest }) => rest)
    .sort((a, b) => a.id.localeCompare(b.id));
  return createHash("sha256").update(JSON.stringify(approved)).digest("hex").slice(0, 16);
}

/** Última aprobación con decisión APPROVED para un objetivo. */
export function latestApproved(project: Project, target: string) {
  return project.approvals.filter((a) => a.target === target && a.decision === "APPROVED").at(-1);
}
