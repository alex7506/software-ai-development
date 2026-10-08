import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { catalogFiles, checkCatalogIntegrity, loadCatalog } from "../src/core/catalog.js";
import { SchemaRegistry, schemaForDocumentType } from "../src/core/schema.js";
import { renderTemplate, unresolvedPlaceholders } from "../src/core/template.js";
import { parseMarkdown, parseYaml, readYaml } from "../src/core/yaml.js";

const cat = loadCatalog();
const registry = new SchemaRegistry(cat);
const methodologyVersion = readFileSync(join(cat.root, "VERSION"), "utf8").trim();

const sample = (id: string): Record<string, string> => ({
  id,
  title: "Ejemplo",
  project_id: "demo-project",
  project_name: "Demo",
  methodology_version: methodologyVersion,
  date: "2026-10-08",
  datetime: "2026-10-08T12:00:00Z",
  author: "Ana Pérez",
  mode: "STANDARD",
  objective: "Implementar el registro de usuarios",
  acceptance_criterion: "Un usuario nuevo puede registrarse con email y contraseña",
  requirement_id: "FR-001",
  reason: "Nuevo requisito del negocio",
  validation_id: "VAL-001",
});

const renderDocument = (type: string) => {
  const def = cat.documentTypes.types[type]!;
  const source = readFileSync(join(cat.root, "templates/documents", def.template), "utf8");
  return renderTemplate(source, sample(`${def.id_prefix}-001`));
};

describe("catálogo", () => {
  it("todos los archivos declaran la versión de la metodología", () => {
    for (const file of catalogFiles()) {
      expect(readYaml<{ version: string }>(file).version, file).toBe(methodologyVersion);
    }
  });

  it("las referencias cruzadas son coherentes", () => {
    expect(checkCatalogIntegrity(cat)).toEqual([]);
  });

  it("las transiciones de estado solo usan estados existentes", () => {
    for (const name of ["task_status", "document_status"]) {
      const def = cat.states[name] as { values: string[]; transitions: Record<string, string[]> };
      expect(Object.keys(def.transitions).sort()).toEqual([...def.values].sort());
      for (const targets of Object.values(def.transitions)) {
        for (const t of targets) expect(def.values).toContain(t);
      }
    }
  });
});

describe("esquemas", () => {
  it("todos compilan en modo estricto", () => {
    expect(registry.names().length).toBeGreaterThanOrEqual(13);
    for (const name of registry.names()) expect(() => registry.get(name)).not.toThrow();
  });

  it("cada esquema referenciado por un tipo de documento existe", () => {
    for (const type of Object.keys(cat.documentTypes.types)) {
      expect(registry.names()).toContain(schemaForDocumentType(cat, type));
    }
  });
});

describe("plantillas de documentos", () => {
  const types = Object.keys(cat.documentTypes.types);

  it("existe una plantilla por tipo y ninguna sobra", () => {
    const expected = types.map((t) => cat.documentTypes.types[t]!.template).sort();
    expect(readdirSync(join(cat.root, "templates/documents")).sort()).toEqual(expected);
  });

  it.each(types)("%s: renderizada es válida y no deja marcadores", (type) => {
    const rendered = renderDocument(type);
    expect(unresolvedPlaceholders(rendered)).toEqual([]);
    const { data } = parseMarkdown(rendered);
    expect(data.document_type).toBe(type);
    const result = registry.validate(schemaForDocumentType(cat, type), data);
    expect(result.errors).toEqual([]);
  });
});

describe("plantillas de proyecto", () => {
  const dir = join(cat.root, "templates/project");
  const files: [string, string][] = [
    [".ai-dev/methodology.yaml", "ai-dev-methodology"],
    [".ai-dev/configuration.yaml", "ai-dev-configuration"],
    [".ai-dev/policies.yaml", "ai-dev-policies"],
    [".ai-dev/state.yaml", "ai-dev-state"],
    [".ai-dev/approvals.yaml", "approvals"],
    ["requirements.yaml", "requirements"],
  ];

  it.each(files)("%s es válido contra %s", (file, schema) => {
    const rendered = renderTemplate(readFileSync(join(dir, file), "utf8"), sample("X-001"));
    expect(unresolvedPlaceholders(rendered)).toEqual([]);
    expect(registry.validate(schema, parseYaml(rendered)).errors).toEqual([]);
  });

  it("AI-CONTEXT.md no deja marcadores", () => {
    expect(existsSync(join(dir, "AI-CONTEXT.md"))).toBe(true);
    const rendered = renderTemplate(readFileSync(join(dir, "AI-CONTEXT.md"), "utf8"), sample("X-001"));
    expect(unresolvedPlaceholders(rendered)).toEqual([]);
  });
});

describe("los esquemas rechazan lo que deben", () => {
  const task = () => parseMarkdown(renderDocument("TASK")).data;
  const prd = () => parseMarkdown(renderDocument("PRD")).data;

  it("un documento APPROVED sin approved_by", () => {
    expect(registry.validate("document", { ...prd(), status: "APPROVED" }).valid).toBe(false);
    expect(registry.validate("document", { ...prd(), status: "APPROVED", approved_by: "Ana Pérez" }).valid).toBe(true);
  });

  it("un estado que no está en el catálogo", () => {
    expect(registry.validate("document", { ...prd(), status: "BORRADOR" }).valid).toBe(false);
    expect(registry.validate("task", { ...task(), status: "BLOCKED_BY_PREVIOUS_TASK" }).valid).toBe(false);
  });

  it("una tarea FEATURE sin requisito implementado", () => {
    expect(registry.validate("task", { ...task(), relations: [] }).valid).toBe(false);
    expect(registry.validate("task", { ...task(), relations: [{ type: "DEPENDS_ON", target: "TASK-002" }] }).valid).toBe(false);
  });

  it("una tarea no FEATURE sin justificación", () => {
    const technical = { ...task(), kind: "TECHNICAL", relations: [] };
    expect(registry.validate("task", technical).valid).toBe(false);
    expect(registry.validate("task", { ...technical, justification: "Configurar CI" }).valid).toBe(true);
  });

  it("una tarea sin criterios de aceptación o con campos desconocidos", () => {
    expect(registry.validate("task", { ...task(), acceptance_criteria: [] }).valid).toBe(false);
    expect(registry.validate("task", { ...task(), prioridad: "alta" }).valid).toBe(false);
  });

  it("un agente con la capacidad de aprobar", () => {
    const agent = { agent_id: "dev", type: "DEVELOPER", provider: "x", capabilities: ["analysis"], max_autonomy_level: 3 };
    expect(registry.validate("agent", agent).valid).toBe(true);
    expect(registry.validate("agent", { ...agent, capabilities: ["analysis", "approval"] }).valid).toBe(false);
  });

  it("una aprobación hecha por un rol no humano", () => {
    const approval = { id: "APR-001", target_type: "PHASE", target: "INTAKE", decision: "APPROVED", by: "Ana", role: "PRODUCT_OWNER", at: "2026-10-08T12:00:00Z" };
    expect(registry.validate("approvals", { approvals: [approval] }).valid).toBe(true);
    expect(registry.validate("approvals", { approvals: [{ ...approval, role: "DEVELOPER" }] }).valid).toBe(false);
  });

  it("una release aprobada sin rollback verificado", () => {
    const release = { ...parseMarkdown(renderDocument("RELEASE")).data, status: "APPROVED", approved_by: "Ana" };
    expect(registry.validate("release", release).valid).toBe(false);
    expect(registry.validate("release", { ...release, rollback_verified: true }).valid).toBe(true);
  });

  it("una política local que no empieza por local_", () => {
    const policy = { id: "no_tests", severity: "BLOCKING", description: "x" };
    expect(registry.validate("ai-dev-policies", { local_policies: [policy] }).valid).toBe(false);
  });
});
