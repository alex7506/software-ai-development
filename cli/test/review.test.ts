import { describe, expect, it } from "vitest";
import { Sandbox } from "./helpers.js";

const PO = ["Ana Pérez", "PRODUCT_OWNER"] as const;
const REQS = "docs/01-product/requirements.yaml";

async function lite(s: Sandbox) {
  const r = await s.run(["init", "--name", "Demo", "--mode", "LITE", "--author", "Claude Code"]);
  expect(r.code, r.err).toBe(0);
}

/** Sesión de revisión de una persona: la primera respuesta confirma el nombre. */
const review = (s: Sandbox, answers: string[], roles = "PRODUCT_OWNER,TECH_LEAD,QA_LEAD") =>
  s.run(["review", "--by", PO[0], "--roles", roles], { answers: [PO[0], ...answers] });

describe("aprobación de requisitos", () => {
  it("un requisito marcado APPROVED a mano no cuenta", async () => {
    const s = new Sandbox();
    await lite(s);
    s.writeYaml(REQS, { project: "demo", prd_ref: "PRD-001", requirements: [{ id: "FR-001", title: "T", description: "D", status: "APPROVED", priority: "MUST", acceptance_criteria: [{ id: "AC-1", description: "c" }] }] });
    const v = await s.run(["validate"]);
    expect(v.code).toBe(1);
    expect(v.out).toContain("sin aprobación registrada");
  });

  it("solo PRODUCT_OWNER los aprueba, y la aprobación fija su contenido", async () => {
    const s = new Sandbox();
    await lite(s);
    await s.requirements([{ id: "FR-001", status: "PROPOSED" }]);
    expect((await s.approve("REQUIREMENTS", "Luis Gómez", "TECH_LEAD")).err).toContain("Los requisitos los aprueba PRODUCT_OWNER");
    expect((await s.approve("REQUIREMENTS", ...PO)).code).toBe(0);
    expect(s.read(REQS)).toContain("status: APPROVED");
    expect((await s.run(["validate"])).code).toBe(0);

    // Añadir un requisito nuevo o marcar uno como implementado no invalida la aprobación.
    const file = s.yaml<{ requirements: Record<string, unknown>[] }>(REQS);
    file.requirements[0]!.status = "IMPLEMENTED";
    file.requirements.push({ id: "FR-002", title: "Nuevo", description: "D", status: "PROPOSED", priority: "SHOULD", acceptance_criteria: [{ id: "AC-1", description: "c" }] });
    s.writeYaml(REQS, file);
    expect((await s.run(["validate"])).code).toBe(0);

    // Cambiar el contenido de uno aprobado sí.
    file.requirements[0]!.description = "Otra cosa";
    s.writeYaml(REQS, file);
    const v = await s.run(["validate"]);
    expect(v.code).toBe(1);
    expect(v.out).toContain("cambiaron después de su aprobación");
  });
});

describe("ai-dev review", () => {
  it("no se puede ejecutar sin una persona en la terminal", async () => {
    const s = new Sandbox();
    await lite(s);
    const r = await s.run(["review", "--by", PO[0], "--roles", "PRODUCT_OWNER"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("no_self_approval");
  });

  it("aprueba documentos y fases en orden y avanza hasta la primera fase incompleta", async () => {
    const s = new Sandbox();
    await lite(s);
    await s.run(["submit", "INTAKE-001"]);
    const r = await review(s, ["s", "s", "s"]);
    expect(r.code, r.err).toBe(0);
    expect(r.out).toContain("APPROVED: INTAKE-001");
    expect(r.out).toContain("Fase INTAKE cerrada. Fase actual: DISCOVERY");
    expect(r.out).toContain("Fase DISCOVERY cerrada. Fase actual: DEFINITION");
    expect(r.out).toContain("DEFINITION aún no está lista");
    expect(r.out).toContain("DELIVERABLE PRD");
    expect(s.yaml<{ phase: string }>(".ai-dev/state.yaml").phase).toBe("DEFINITION");
    expect(s.yaml<{ approvals: unknown[] }>(".ai-dev/approvals.yaml").approvals).toHaveLength(3);
    expect((await s.run(["validate"])).code).toBe(0);
  });

  it("decide sobre los requisitos pendientes dentro de la sesión", async () => {
    const s = new Sandbox();
    await lite(s);
    s.setState({ phase: "DEFINITION" });
    await s.run(["new", "PRD", "--title", "Producto"]);
    await s.run(["submit", "PRD-001"]);
    await s.requirements([{ id: "FR-001", status: "PROPOSED" }]);
    const r = await review(s, ["s", "s", "s", "t"]);
    expect(r.out).toContain("APPROVED: PRD-001");
    expect(r.out).toContain("APPROVED: REQUIREMENTS");
    expect(r.out).toContain("Fase DEFINITION cerrada. Fase actual: DESIGN");
    expect(r.out).toContain("Terminada por la persona");
    expect(s.read(REQS)).toContain("status: APPROVED");
  });

  it("pedir cambios devuelve el documento a borrador y omitir no aprueba nada", async () => {
    const s = new Sandbox();
    await lite(s);
    await s.run(["submit", "INTAKE-001"]);
    const r = await review(s, ["c", "Falta el problema", "o"]);
    expect(r.out).toContain("CHANGES_REQUESTED: INTAKE-001");
    expect(r.out).toContain("INTAKE aún no está lista");
    expect(s.read("docs/00-intake/INTAKE-001-intake-demo.md")).toContain("status: DRAFT");
    expect(s.yaml<{ phase: string }>(".ai-dev/state.yaml").phase).toBe("INTAKE");
  });

  it("se detiene si la fase la aprueba un rol que la persona no asumió", async () => {
    const s = new Sandbox();
    await lite(s);
    s.setState({ phase: "ARCHITECTURE" });
    await s.run(["new", "ARCHITECTURE", "--title", "Arquitectura"]);
    await s.run(["submit", "ARCH-001"]);
    const r = await review(s, [], "PRODUCT_OWNER");
    expect(r.out).toContain("ARCH-001 lo aprueba un rol que no asumiste");
    expect(r.out).toContain("ARCHITECTURE aún no está lista");
  });
});
