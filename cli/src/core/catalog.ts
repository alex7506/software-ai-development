import { readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readYaml } from "./yaml.js";

type Dict<T = unknown> = Record<string, T>;

export const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

export interface Catalog {
  root: string;
  states: Dict<{ values?: string[] } & Dict>;
  phases: {
    order: string[];
    phases: Dict<{ approver: string; deliverables: { type: string; min_mode: string; when?: string }[]; gates?: string[] }>;
    gates: Dict<string>;
    project_features: Dict<string>;
    non_document_deliverables: Dict<string>;
  };
  modes: { order: string[]; modes: Dict<{ gates_required: string[]; max_autonomy_level: number } & Dict> };
  documentTypes: {
    folders: Dict<string>;
    types: Dict<{ id_prefix: string; template: string; folder: string; schema?: string }>;
    default_schema: string;
  };
  lifecycle: { steps: string[]; executors: string[] };
  roles: { roles: Dict<{ human_only?: boolean; agent_type?: string; approves?: string[] }>; agent_types: string[] };
  risk: { levels: Dict<{ max_autonomy_level: number; approval: string }> };
  dataClassification: { destination_types: Dict<string>; levels: Dict<{ risk: string; allowed_destinations: string[] }> };
  limits: Dict<number | string>;
  definitions: { definition_of_ready: { id: string }[]; definition_of_done: { id: string }[]; task_kinds: Dict<string> };
  capabilities: { capabilities: Dict<{ risk: string; human_only?: boolean }> };
  policies: { policies: { id: string; severity: string }[] };
}

export function loadCatalog(root = DEFAULT_ROOT): Catalog {
  const c = (name: string) => readYaml<any>(join(root, "methodology/catalog", name));
  return {
    root,
    states: c("states.yaml"),
    phases: c("phases.yaml"),
    modes: c("modes.yaml"),
    documentTypes: c("document-types.yaml"),
    lifecycle: c("lifecycle.yaml"),
    roles: c("roles.yaml"),
    risk: c("risk.yaml"),
    dataClassification: c("data-classification.yaml"),
    limits: c("limits.yaml"),
    definitions: c("definitions.yaml"),
    capabilities: readYaml(join(root, "agents/capabilities.yaml")),
    policies: readYaml(join(root, "agents/policies/agent-policies.yaml")),
  };
}

export function catalogFiles(root = DEFAULT_ROOT): string[] {
  return readdirSync(join(root, "methodology/catalog"))
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => join(root, "methodology/catalog", f));
}

/** Enums derivados del catálogo; son la única fuente de los valores que validan los esquemas. */
export function buildEnums(cat: Catalog): Dict<string[]> {
  const enums: Dict<string[]> = {};
  for (const [name, def] of Object.entries(cat.states)) {
    if (def && typeof def === "object" && Array.isArray(def.values)) {
      enums[name === "relation_types" ? "relation_type" : name] = def.values;
    }
  }
  const roles = Object.entries(cat.roles.roles);
  Object.assign(enums, {
    document_type: Object.keys(cat.documentTypes.types),
    phase: cat.phases.order,
    mode: cat.modes.order,
    role: roles.map(([id]) => id),
    human_role: roles.filter(([, r]) => r.human_only).map(([id]) => id),
    agent_type: cat.roles.agent_types,
    risk_level: Object.keys(cat.risk.levels),
    data_classification: Object.keys(cat.dataClassification.levels),
    destination_type: Object.keys(cat.dataClassification.destination_types),
    capability: Object.keys(cat.capabilities.capabilities),
    policy_id: cat.policies.policies.map((p) => p.id),
    executor: cat.lifecycle.executors,
    task_kind: Object.keys(cat.definitions.task_kinds),
    project_feature: Object.keys(cat.phases.project_features),
  });
  return enums;
}

export function buildEnumsSchema(cat: Catalog): object {
  const $defs = Object.fromEntries(Object.entries(buildEnums(cat)).map(([k, v]) => [k, { enum: v }]));
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://ai-dev.local/schemas/enums.schema.yaml",
    $defs,
  };
}

/** Comprueba que las referencias entre archivos del catálogo existan. Devuelve los errores encontrados. */
export function checkCatalogIntegrity(cat: Catalog): string[] {
  const errors: string[] = [];
  const { phases, roles, documentTypes, modes, risk } = cat;
  const types = documentTypes.types;

  for (const p of phases.order) if (!phases.phases[p]) errors.push(`phases.order: fase ${p} sin definición`);
  for (const [name, p] of Object.entries(phases.phases)) {
    if (!roles.roles[p.approver]?.human_only) errors.push(`${name}: aprobador ${p.approver} no es un rol humano`);
    for (const d of p.deliverables ?? []) {
      if (!types[d.type] && !phases.non_document_deliverables[d.type]) errors.push(`${name}: tipo ${d.type} desconocido`);
      if (!modes.order.includes(d.min_mode)) errors.push(`${name}: modo ${d.min_mode} desconocido`);
      if (d.when && d.when !== "on_change" && !phases.project_features[d.when]) errors.push(`${name}: característica ${d.when} desconocida`);
    }
    for (const g of p.gates ?? []) if (!phases.gates[g]) errors.push(`${name}: gate ${g} desconocido`);
  }
  for (const [name, m] of Object.entries(modes.modes)) {
    for (const g of m.gates_required) if (!phases.gates[g]) errors.push(`modo ${name}: gate ${g} desconocido`);
  }
  const approved = new Set(Object.values(roles.roles).flatMap((r) => r.approves ?? []));
  for (const p of phases.order) if (!approved.has(p)) errors.push(`ningún rol aprueba la fase ${p}`);
  for (const [name, r] of Object.entries(roles.roles)) {
    if (r.agent_type && !roles.agent_types.includes(r.agent_type)) errors.push(`rol ${name}: agent_type ${r.agent_type} desconocido`);
  }
  for (const [name, c] of Object.entries(cat.capabilities.capabilities)) {
    if (!risk.levels[c.risk]) errors.push(`capacidad ${name}: riesgo ${c.risk} desconocido`);
  }
  for (const [name, l] of Object.entries(cat.dataClassification.levels)) {
    if (!risk.levels[l.risk]) errors.push(`dato ${name}: riesgo ${l.risk} desconocido`);
    for (const d of l.allowed_destinations) {
      if (!cat.dataClassification.destination_types[d]) errors.push(`dato ${name}: destino ${d} desconocido`);
    }
  }
  for (const [name, t] of Object.entries(types)) {
    if (!documentTypes.folders[t.folder.split("/")[0]!]) errors.push(`tipo ${name}: carpeta ${t.folder} desconocida`);
  }
  return errors;
}
