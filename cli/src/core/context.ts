import { existsSync } from "node:fs";
import { CliError } from "./issues.js";
import type { DocumentRecord, Project, Requirement } from "./project.js";
import { isApproved } from "./rules.js";

/**
 * Paquete de contexto mínimo suficiente para ejecutar una tarea: la tarea, lo que implementa,
 * sus dependencias, las decisiones vigentes y las reglas que aplican. No incluye el proyecto completo.
 */
export function buildContext(p: Project, taskId: string): string {
  const task = p.document(taskId);
  if (task.type !== "TASK") throw new CliError(`${taskId} no es una tarea.`);
  const d = task.data;
  const m = p.methodology;
  const reqs = new Map(p.requirements().map((r) => [r.id, r]));
  const docs = new Map(p.documents().map((doc) => [doc.id, doc]));
  const relations = (d.relations as { type: string; target: string }[] | undefined) ?? [];

  const risk = String(d.risk);
  const riskDef = p.cat.risk.levels[risk];
  const dataLevel = String(d.data_classification);
  const dataDef = p.cat.dataClassification.levels[dataLevel];
  const autonomy = Math.min(riskDef?.max_autonomy_level ?? 0, p.modeDef.max_autonomy_level);
  const providers = (p.configuration.providers ?? []).filter((pr) => dataDef?.allowed_destinations.includes(pr.destination_type)).map((pr) => pr.name);

  const out: string[] = [];
  out.push(`# Contexto de ${task.id} — ${String(d.title)}`, "");
  out.push(`> Generado por \`ai-dev context\`. Es el contexto mínimo para esta tarea; las fuentes de verdad son los archivos citados.`, "");

  out.push("## Proyecto", "");
  out.push(`- ${m.project.name} (\`${m.project.id}\`), modo ${p.mode}, fase ${p.state.phase}.`);
  out.push(`- Metodología ${m.methodology.version}. Perfil tecnológico: ${m.technology_profile ?? "sin definir"}.`, "");

  out.push("## Tarea", "");
  out.push(`- Archivo: \`${task.rel}\``);
  out.push(`- Estado: ${String(d.status)} · Tipo: ${String(d.kind)} · Ejecutor: ${String(d.executor)}`);
  out.push(`- Objetivo: ${String(d.objective)}`);
  if (d.justification) out.push(`- Justificación: ${String(d.justification)}`);
  out.push("", "### Criterios de aceptación", "");
  for (const ac of (d.acceptance_criteria as { id: string; description: string }[]) ?? []) out.push(`- **${ac.id}**: ${ac.description}`);
  const constraints = (d.constraints as string[] | undefined) ?? [];
  if (constraints.length) out.push("", "### Restricciones", "", ...constraints.map((c) => `- ${c}`));
  if (task.content.trim()) out.push("", "### Notas de la tarea", "", task.content.trim());
  out.push("");

  const implemented = relations.filter((r) => r.type === "IMPLEMENTS").map((r) => reqs.get(r.target)).filter((r): r is Requirement => Boolean(r));
  if (implemented.length) {
    out.push("## Requisitos que implementa", "");
    for (const r of implemented) {
      out.push(`### ${r.id} — ${r.title} (${r.status}, ${r.priority})`, "", String(r.description ?? ""), "");
      for (const ac of r.acceptance_criteria) out.push(`- ${ac.id}: ${ac.description}`);
      out.push("");
    }
  }

  const deps = [...new Set([...((d.blocked_by as string[] | undefined) ?? []), ...relations.filter((r) => r.type === "DEPENDS_ON").map((r) => r.target)])];
  const related = relations.filter((r) => r.type !== "IMPLEMENTS" && r.type !== "DEPENDS_ON").map((r) => docs.get(r.target)).filter((x): x is DocumentRecord => Boolean(x));
  if (deps.length || related.length) {
    out.push("## Dependencias y documentos relacionados", "");
    for (const dep of deps) {
      const doc = docs.get(dep);
      out.push(`- ${dep}: ${doc ? `${String(doc.data.title)} — ${String(doc.data.status)} (\`${doc.rel}\`)` : "no existe"}`);
    }
    for (const doc of related) out.push(`- ${doc.id}: ${String(doc.data.title)} (\`${doc.rel}\`)`);
    out.push("");
  }

  const adrs = p.documents().filter((x) => x.type === "ADR" && isApproved(x));
  if (adrs.length) {
    out.push("## Decisiones vigentes (ADR aceptados)", "");
    for (const adr of adrs) out.push(`- ${adr.id}: ${String(adr.data.title)} (\`${adr.rel}\`)`);
    out.push("");
  }

  const sources = (d.context_sources as string[] | undefined) ?? [];
  if (sources.length) {
    const max = p.limit("max_context_files_without_justification");
    out.push("## Fuentes de contexto declaradas", "");
    for (const s of sources) out.push(`- \`${s}\`${existsSync(p.path(s)) ? "" : " (no encontrado)"}`);
    if (sources.length > max) out.push("", `> Más de ${max} fuentes: justifica en la tarea por qué hacen falta.`);
    out.push("");
  }

  out.push("## Reglas para esta tarea", "");
  out.push(`- Riesgo **${risk}**: aprobación \`${riskDef?.approval ?? "UNKNOWN"}\`. Autonomía máxima efectiva: **${autonomy}**.`);
  out.push(`- Capacidades concedidas para la tarea: ${((d.capabilities as string[]) ?? []).join(", ")}. No uses otras.`);
  out.push(`- Datos **${dataLevel}**: destinos permitidos ${dataDef?.allowed_destinations.join(", ") || "ninguno"}${providers.length ? ` (proveedores del proyecto: ${providers.join(", ")})` : ""}.`);
  out.push(`- Máximo ${p.limit("max_auto_fix_attempts")} correcciones automáticas; registra cada una con \`ai-dev task attempt ${task.id}\`.`);
  out.push(`- Cada commit incluye el trailer \`Task: ${task.id}\`.`);
  out.push(`- Registra la evidencia de cada criterio con \`ai-dev task evidence\`. Nunca ejecutes \`ai-dev approve\`.`, "");

  out.push("### Políticas obligatorias", "");
  for (const pol of p.cat.policies.policies) out.push(`- \`${pol.id}\`: ${(pol as { description?: string }).description ?? ""}`);
  const local = p.hasAiDev("policies") ? (p.readAiDev<{ local_policies?: { id: string; description: string }[] }>("policies").local_policies ?? []) : [];
  for (const pol of local) out.push(`- \`${pol.id}\` (local): ${pol.description}`);
  out.push("");
  return out.join("\n");
}
