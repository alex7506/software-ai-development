import { recordApproval } from "./approvals.js";
import { reviewStatus } from "./documents.js";
import { CliError } from "./issues.js";
import { advancePhase, checkPhase, reenterPhase } from "./phases.js";
import type { Approval, Project } from "./project.js";
import type { SchemaRegistry } from "./schema.js";

export interface ReviewOptions {
  by: string;
  /** Roles aprobadores que asume la persona en esta sesión. */
  roles: string[];
  now: () => Date;
  ask: (question: string) => Promise<string>;
  out: (text: string) => void;
}

export interface ReviewSummary {
  decisions: { target: string; decision: Approval["decision"] }[];
  advanced: string[];
  finalPhase: string;
  stopReason: string;
}

const DECISIONS: Record<string, Approval["decision"]> = { s: "APPROVED", c: "CHANGES_REQUESTED", r: "REJECTED" };
const PROMPT = "[s] aprobar · [c] pedir cambios · [r] rechazar · [o] omitir · [t] terminar: ";

/**
 * Sesión interactiva de revisión para una persona: decide sobre los documentos en revisión,
 * los requisitos pendientes y la fase actual, y avanza mientras todo esté listo y aprobado.
 * Cada decisión se confirma por separado; nada se aprueba sin respuesta explícita.
 */
export async function reviewSession(p: Project, registry: SchemaRegistry, cliVersion: string, opts: ReviewOptions): Promise<ReviewSummary> {
  const summary: ReviewSummary = { decisions: [], advanced: [], finalPhase: p.state.phase, stopReason: "" };
  const skipped = new Set<string>();

  const decide = async (target: string, label: string, role: string): Promise<"done" | "skip" | "stop"> => {
    const answer = (await opts.ask(`\n${label}\n${PROMPT}`)).trim().toLowerCase();
    if (answer === "t") return "stop";
    const decision = DECISIONS[answer];
    if (!decision) {
      skipped.add(target);
      return "skip";
    }
    const comment = decision === "APPROVED" ? undefined : (await opts.ask("Comentario: ")).trim() || undefined;
    try {
      recordApproval(p, registry, cliVersion, { target, by: opts.by, role, decision, comment }, opts.now());
      summary.decisions.push({ target, decision });
      opts.out(`  ✔ ${decision}: ${target}`);
    } catch (e) {
      if (!(e instanceof CliError)) throw e;
      opts.out(`  ✖ ${e.message}`);
      skipped.add(target);
    }
    return "done";
  };

  for (;;) {
    p.invalidate();

    // 1. Documentos enviados a revisión, en el orden de las fases que los exigen.
    for (const doc of [...p.documents()].sort((a, b) => phaseOf(p, a.type) - phaseOf(p, b.type))) {
      if (doc.type === "TASK" || skipped.has(doc.id) || doc.data.status !== reviewStatus(doc.type)) continue;
      const role = roleFor(p, doc.type, opts.roles);
      if (!role) {
        opts.out(`  ▲ ${doc.id} lo aprueba un rol que no asumiste en esta sesión.`);
        skipped.add(doc.id);
        continue;
      }
      const label = `${doc.id} — ${String(doc.data.title)} (v${String(doc.data.version)}, ${doc.rel}) como ${role}`;
      if ((await decide(doc.id, label, role)) === "stop") return finish(p, summary, "Terminada por la persona.");
    }

    // 2. Requisitos pendientes.
    const pending = p.requirements().filter((r) => r.status === "PROPOSED");
    if (pending.length && !skipped.has("REQUIREMENTS")) {
      const role = p.cat.phases.phases.DEFINITION?.approver ?? "PRODUCT_OWNER";
      if (opts.roles.includes(role)) {
        const label = `Requisitos pendientes: ${pending.map((r) => `${r.id} ${r.title}`).join("; ")} como ${role}`;
        if ((await decide("REQUIREMENTS", label, role)) === "stop") return finish(p, summary, "Terminada por la persona.");
      }
    }

    // 3. Fase actual. En EVOLUTION, una solicitud de cambio aprobada reingresa al ciclo.
    const phase = p.state.phase;
    if (phase === p.cat.phases.order.at(-1)) {
      const change = p.documents().find((d) => d.type === "CHANGE_REQUEST" && d.data.status === "APPROVED");
      if (!change) return finish(p, summary, `${phase} es la última fase.`);
      const { to } = reenterPhase(p, change.id, opts.now());
      summary.advanced.push(`${phase} → ${to}`);
      opts.out(`  → ${change.id} aprobado: reingreso al ciclo en ${to}.`);
      continue;
    }
    const check = checkPhase(p, registry, cliVersion, phase);
    if (!check.ready) {
      const missing = check.items.filter((i) => !i.ok && i.kind !== "APPROVAL").map((i) => `  - ${i.kind} ${i.name}: ${i.detail}`);
      return finish(p, summary, `${phase} aún no está lista:\n${missing.join("\n")}`);
    }
    if (!check.approved) {
      if (skipped.has(phase)) return finish(p, summary, `Fase ${phase} sin aprobar.`);
      const approver = p.cat.phases.phases[phase]!.approver;
      const role = opts.roles.includes(approver) ? approver : opts.roles.includes("SECURITY_OFFICER") ? "SECURITY_OFFICER" : null;
      if (!role) return finish(p, summary, `La fase ${phase} la aprueba ${approver}, que no asumiste en esta sesión.`);
      if ((await decide(phase, `Fase ${phase}: entregables, comprobaciones y gates completos. ¿Aprobarla como ${role}?`, role)) === "stop") {
        return finish(p, summary, "Terminada por la persona.");
      }
      if (!checkPhase(p, registry, cliVersion, phase).approved) return finish(p, summary, `Fase ${phase} sin aprobar.`);
    }
    const { from, to } = advancePhase(p, registry, cliVersion, opts.now());
    summary.advanced.push(`${from} → ${to}`);
    opts.out(`  → Fase ${from} cerrada. Fase actual: ${to}.`);
  }
}

function finish(p: Project, summary: ReviewSummary, reason: string): ReviewSummary {
  summary.finalPhase = p.state.phase;
  summary.stopReason = reason;
  return summary;
}

/** Posición en el ciclo de la primera fase que exige un tipo de documento (al final si ninguna lo exige). */
function phaseOf(p: Project, type: string): number {
  const index = p.cat.phases.order.findIndex((name) => p.cat.phases.phases[name]?.deliverables?.some((d) => d.type === type));
  return index < 0 ? p.cat.phases.order.length : index;
}

/** Rol que aprueba un tipo de documento: el aprobador de la fase que lo exige, si la persona lo asume. */
function roleFor(p: Project, type: string, roles: string[]): string | null {
  const phase = Object.values(p.cat.phases.phases).find((ph) => ph.deliverables?.some((d) => d.type === type));
  const role = phase?.approver;
  if (role && roles.includes(role)) return role;
  return phase ? null : (roles[0] ?? null);
}
