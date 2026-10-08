import { commits, isGitRepo, isMethodologyOnly } from "./git.js";
import { error, warning, type Issue } from "./issues.js";
import type { Project } from "./project.js";
import { REQUIREMENTS_FILE } from "./project.js";
import { integrityIndex, isRequirementApproved, phaseIndex, worstIntegrity } from "./rules.js";

type Severity = "WARNINGS" | "DEGRADED" | "BLOCKED";

interface Edge {
  from: string;
  type: string;
  to: string;
  file: string;
  confidence?: number;
  confirmed?: boolean;
}

export interface TraceResult {
  status: string;
  minimum: string;
  meetsMinimum: boolean;
  issues: Issue[];
  stats: { nodes: number; edges: number; requirements: number; tasks: number; commits?: number };
}

/** Construye el grafo de relaciones y determina el estado de integridad del proyecto. */
export function traceProject(p: Project, options: { git?: boolean } = {}): TraceResult {
  const findings: { severity: Severity; issue: Issue }[] = [];
  const add = (severity: Severity, code: string, message: string, file?: string) =>
    findings.push({ severity, issue: severity === "WARNINGS" ? warning(code, message, file) : error(code, message, file) });

  const docs = p.documents();
  const requirements = p.requirements();
  const tasks = p.tasks();
  const ids = p.knownIds();

  const edges: Edge[] = [
    ...docs.flatMap((d) => relationsOf(d.data.relations).map((r) => ({ ...r, from: d.id, file: d.rel }))),
    ...requirements.flatMap((r) => relationsOf(r.relations).map((rel) => ({ ...rel, from: r.id, file: REQUIREMENTS_FILE }))),
  ];

  for (const e of edges) {
    if (!ids.has(e.to)) add("BLOCKED", "broken_reference", `${e.from} ${e.type} ${e.to}: el destino no existe.`, e.file);
    if (e.confidence !== undefined && e.confirmed !== true) {
      add("WARNINGS", "unconfirmed_relation", `${e.from} ${e.type} ${e.to} fue inferida (confianza ${e.confidence}) y nadie la ha confirmado.`, e.file);
    }
    if (e.type === "CONFLICTS_WITH") add("DEGRADED", "conflict", `${e.from} está en conflicto con ${e.to}; resuélvelo o documenta la decisión.`, e.file);
  }

  const implemented = new Map<string, string[]>();
  for (const e of edges.filter((e) => e.type === "IMPLEMENTS")) implemented.set(e.to, [...(implemented.get(e.to) ?? []), e.from]);

  const reqStatus = new Map(requirements.map((r) => [r.id, r.status]));
  for (const task of tasks) {
    for (const e of edges.filter((e) => e.from === task.id && e.type === "IMPLEMENTS")) {
      const status = reqStatus.get(e.to);
      if (status && ["REJECTED", "DEPRECATED"].includes(status)) {
        add("WARNINGS", "obsolete_requirement", `${task.id} implementa ${e.to}, que está ${status}.`, task.rel);
      }
    }
  }

  // Tras PLANNING, todo requisito aprobado debe tener al menos una tarea que lo implemente.
  if (phaseIndex(p.cat, p.state.phase) > phaseIndex(p.cat, "PLANNING")) {
    for (const r of requirements.filter((r) => isRequirementApproved(r.status))) {
      if (!implemented.get(r.id)?.some((from) => from.startsWith("TASK-"))) {
        add("DEGRADED", "orphan_requirement", `${r.id} está aprobado y ninguna tarea lo implementa.`, REQUIREMENTS_FILE);
      }
    }
  }

  let commitCount: number | undefined;
  if (options.git) {
    if (!isGitRepo(p.root)) {
      add("WARNINGS", "no_git", "El proyecto no es un repositorio Git: no se pueden trazar commits.");
    } else {
      const history = commits(p.root, p.methodology.adopted_at);
      commitCount = history.length;
      const taskIds = new Set(tasks.map((t) => t.id));
      // Los commits que solo tocan documentación de la metodología pertenecen a las fases, no a una tarea.
      const untraced = history.filter((c) => !c.tasks.length && !isMethodologyOnly(c));
      if (untraced.length && tasks.length) {
        add("WARNINGS", "untraced_commits", `${untraced.length} de ${history.length} commits no tienen trailer "Task: TASK-NNN".`);
      }
      for (const c of history) {
        for (const t of c.tasks.filter((t) => !taskIds.has(t))) add("DEGRADED", "unknown_task_in_commit", `El commit ${c.hash.slice(0, 7)} referencia ${t}, que no existe.`);
      }
      const withCommits = new Set(history.flatMap((c) => c.tasks));
      for (const t of tasks.filter((t) => t.data.status === "COMPLETED" && !withCommits.has(t.id))) {
        add("WARNINGS", "task_without_commits", `${t.id} está COMPLETED y ningún commit la referencia.`, t.rel);
      }
    }
  }

  const status = worstIntegrity(p.cat, ["INTEGRITY_OK", ...findings.map((f) => f.severity)]);
  const minimum = String(p.modeDef.traceability_minimum);
  return {
    status,
    minimum,
    meetsMinimum: integrityIndex(p.cat, status) <= integrityIndex(p.cat, minimum),
    issues: findings.map((f) => f.issue),
    stats: { nodes: ids.size, edges: edges.length, requirements: requirements.length, tasks: tasks.length, commits: commitCount },
  };
}

function relationsOf(value: unknown): Omit<Edge, "from" | "file">[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((r): r is { type: string; target: string; confidence?: number; confirmed?: boolean } => r && typeof r.target === "string")
    .map((r) => ({ type: r.type, to: r.target, confidence: r.confidence, confirmed: r.confirmed }));
}
