import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Sandbox } from "./helpers.js";

const PO = ["Ana Pérez", "PRODUCT_OWNER"] as const;
const TL = ["Luis Gómez", "TECH_LEAD"] as const;

async function initLite(s: Sandbox, extra: string[] = []) {
  const r = await s.run(["init", "--name", "Gestor de Tareas", "--mode", "LITE", "--author", "Carla Dev", ...extra]);
  expect(r.err).toBe("");
  expect(r.code).toBe(0);
  return r;
}

describe("init", () => {
  it("crea la estructura de un proyecto nuevo, válida desde el inicio", async () => {
    const s = new Sandbox();
    const r = await initLite(s);
    expect(r.out).toContain("Proyecto inicializado");
    for (const f of [".ai-dev/methodology.yaml", ".ai-dev/configuration.yaml", ".ai-dev/policies.yaml", ".ai-dev/state.yaml", ".ai-dev/approvals.yaml", "AI-CONTEXT.md", "docs/01-product/requirements.yaml"]) {
      expect(existsSync(s.path(f)), f).toBe(true);
    }
    expect(readdirSync(s.path("docs/00-intake"))).toEqual(["INTAKE-001-intake-gestor-de-tareas.md"]);
    const m = s.yaml<{ project: { id: string }; mode: string; adopted_at: unknown }>(".ai-dev/methodology.yaml");
    expect(m.project.id).toBe("gestor-de-tareas");
    expect(m.mode).toBe("LITE");
    expect(m.adopted_at).toBeNull();
    expect(s.read(".gitignore")).toContain(".env");

    const v = await s.run(["validate"]);
    expect(v.code, v.out).toBe(0);
    expect(v.out).toContain("0 errores");
  });

  it("es idempotente: una segunda ejecución no sobrescribe nada", async () => {
    const s = new Sandbox();
    await initLite(s);
    writeFileSync(s.path("AI-CONTEXT.md"), "# Editado a mano\n");
    const r = await initLite(s);
    expect(r.out).toContain("Ya existían");
    expect(s.read("AI-CONTEXT.md")).toBe("# Editado a mano\n");
    expect(readdirSync(s.path("docs/00-intake"))).toHaveLength(1);
  });

  it("adopta un proyecto existente sin tocar su código y permite declarar la fase", async () => {
    const s = new Sandbox();
    mkdirSync(s.path("src"));
    writeFileSync(s.path("src/index.js"), "console.log('hola');\n");
    const r = await initLite(s, ["--phase", "DEVELOPMENT"]);
    expect(r.out).toContain("Proyecto existente adoptado");
    expect(s.yaml<{ adopted_at: string }>(".ai-dev/methodology.yaml").adopted_at).toBe("2026-10-08");
    expect(s.yaml<{ phase: string }>(".ai-dev/state.yaml").phase).toBe("DEVELOPMENT");
    expect(existsSync(s.path("docs/00-intake"))).toBe(false);
    expect(s.read("src/index.js")).toBe("console.log('hola');\n");
  });

  it("rechaza --phase en un proyecto nuevo y proyectos anidados", async () => {
    const s = new Sandbox();
    const r = await s.run(["init", "--name", "X", "--phase", "DEVELOPMENT"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("--phase solo se usa al adoptar");
    await initLite(s);
    mkdirSync(s.path("sub"));
    const nested = await s.run(["init", "--name", "Sub"], { cwd: s.path("sub") });
    expect(nested.code).toBe(1);
    expect(nested.err).toContain("no se anidan proyectos");
  });

  it("los comandos fuera de un proyecto explican cómo empezar", async () => {
    const r = await new Sandbox().run(["status"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("ai-dev init");
  });
});

describe("aprobaciones", () => {
  it("un agente (sin terminal interactiva) no puede aprobar", async () => {
    const s = new Sandbox();
    await initLite(s);
    const r = await s.run(["approve", "INTAKE", "--by", PO[0], "--role", PO[1]]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("no_self_approval");
    expect(s.yaml<{ approvals: unknown[] }>(".ai-dev/approvals.yaml").approvals).toEqual([]);
  });

  it("exige confirmar el nombre y un rol humano con autoridad", async () => {
    const s = new Sandbox();
    await initLite(s);
    const wrong = await s.run(["approve", "INTAKE-001", "--by", PO[0], "--role", PO[1]], { answers: ["Otra persona"] });
    expect(wrong.err).toContain("no coincide");
    const agentRole = await s.approve("INTAKE-001", "Bot", "DEVELOPER");
    expect(agentRole.err).toContain("no puede aprobar");
  });

  it("documento: submit → approve; editarlo después invalida la aprobación; revise lo reabre", async () => {
    const s = new Sandbox();
    await initLite(s);
    const rel = "docs/00-intake/INTAKE-001-intake-gestor-de-tareas.md";

    const notSubmitted = await s.approve("INTAKE-001", ...PO);
    expect(notSubmitted.err).toContain("ai-dev submit");

    expect((await s.run(["submit", "INTAKE-001"])).code).toBe(0);
    const ok = await s.approve("INTAKE-001", ...PO);
    expect(ok.code, ok.err).toBe(0);
    expect(s.read(rel)).toContain("status: APPROVED");
    expect(s.read(rel)).toContain("approved_by: Ana Pérez");
    expect((await s.run(["validate"])).code).toBe(0);

    s.editDocument(rel, (d) => (d.content += "\nCambio no aprobado.\n"));
    const tampered = await s.run(["validate"]);
    expect(tampered.code).toBe(1);
    expect(tampered.out).toContain("cambió después de aprobarse");

    expect((await s.run(["revise", "INTAKE-001"])).code).toBe(0);
    expect(s.read(rel)).toContain("version: 0.2.0");
    expect(s.read(rel)).toContain("status: IN_REVIEW");
    expect((await s.run(["validate"])).code).toBe(0);
  });

  it("un estado APPROVED escrito a mano sin aprobación registrada es un error", async () => {
    const s = new Sandbox();
    await initLite(s);
    s.editDocument("docs/00-intake/INTAKE-001-intake-gestor-de-tareas.md", (d) => {
      d.data.status = "APPROVED";
      d.data.approved_by = "Bot";
    });
    const r = await s.run(["validate"]);
    expect(r.code).toBe(1);
    expect(r.out).toContain("sin aprobación registrada");
  });

  it("en STANDARD el autor no puede aprobar su propio documento", async () => {
    const s = new Sandbox();
    await s.run(["init", "--name", "Producto", "--mode", "STANDARD", "--author", PO[0]]);
    await s.run(["submit", "INTAKE-001"]);
    const r = await s.approve("INTAKE-001", ...PO);
    expect(r.code).toBe(1);
    expect(r.err).toContain("exige que lo apruebe otra persona");
  });
});

describe("fases", () => {
  it("no se avanza sin entregables aprobados ni aprobación de fase", async () => {
    const s = new Sandbox();
    await initLite(s);
    const check = await s.run(["phase", "check"]);
    expect(check.code).toBe(1);
    expect(check.out).toContain("PROJECT_INTAKE");

    const early = await s.approve("INTAKE", ...PO);
    expect(early.err).toContain("aún no está lista");

    await s.run(["submit", "INTAKE-001"]);
    await s.approve("INTAKE-001", ...PO);
    const noApproval = await s.run(["phase", "advance"]);
    expect(noApproval.code).toBe(1);
    expect(noApproval.err).toContain("APPROVAL");

    const wrongRole = await s.approve("INTAKE", ...TL);
    expect(wrongRole.err).toContain("la aprueba PRODUCT_OWNER");

    expect((await s.approve("INTAKE", ...PO)).code).toBe(0);
    const adv = await s.run(["phase", "advance"]);
    expect(adv.code, adv.err).toBe(0);
    expect(s.yaml<{ phase: string }>(".ai-dev/state.yaml").phase).toBe("DISCOVERY");

    // LITE no exige entregables en DISCOVERY, pero sí su aprobación; la del INTAKE no cuenta.
    expect((await s.run(["phase", "advance"])).code).toBe(1);
    expect((await s.approve("DISCOVERY", ...PO)).code).toBe(0);
    expect((await s.run(["phase", "advance"])).code).toBe(0);
    expect(s.yaml<{ phase: string }>(".ai-dev/state.yaml").phase).toBe("DEFINITION");
  });

  it("DEFINITION exige requisitos decididos además del PRD", async () => {
    const s = new Sandbox();
    await initLite(s);
    s.setState({ phase: "DEFINITION" });
    s.requirements([{ id: "FR-001", status: "PROPOSED" }]);
    const r = await s.run(["phase", "check"]);
    expect(r.out).toContain("Requisitos sin decidir (PROPOSED): FR-001");
    expect(r.out).toContain("ai-dev new PRD");
  });
});

describe("tareas", () => {
  async function withRequirement(status = "APPROVED") {
    const s = new Sandbox();
    await initLite(s);
    s.requirements([{ id: "FR-001", status }]);
    const t = await s.run(["task", "new", "--title", "Registro de usuarios", "--implements", "FR-001", "--criterion", "Un usuario se registra con email"]);
    expect(t.out).toContain("Creada TASK-001");
    return s;
  }
  const taskFile = (s: Sandbox) => join("docs/06-execution/tasks", readdirSync(s.path("docs/06-execution/tasks"))[0]!);

  it("recorre el ciclo completo con Definition of Ready y Definition of Done", async () => {
    const s = await withRequirement();
    expect((await s.run(["task", "complete", "TASK-001"])).err).toContain("no se puede pasar de PENDING a COMPLETED");

    expect((await s.run(["task", "ready", "TASK-001"])).code).toBe(0);
    expect((await s.run(["task", "start", "TASK-001"])).code).toBe(0);
    expect(s.yaml<{ current_task: string }>(".ai-dev/state.yaml").current_task).toBe("TASK-001");
    expect((await s.run(["task", "validate", "TASK-001"])).code).toBe(0);

    const noEvidence = await s.run(["task", "complete", "TASK-001"]);
    expect(noEvidence.err).toContain("Falta evidencia para AC-1");
    expect(noEvidence.err).toContain("provenance");

    await s.run(["task", "evidence", "TASK-001", "--criterion", "AC-1", "--type", "TEST_RUN", "--ref", "npm test — 12 passed"]);
    await s.run(["task", "provenance", "TASK-001", "--generated-by", "claude-code", "--model", "claude-opus-5-5"]);
    const done = await s.run(["task", "complete", "TASK-001"]);
    expect(done.code, done.err).toBe(0);
    expect(done.out).toContain("no usa Git");
    expect(s.yaml<{ current_task: unknown }>(".ai-dev/state.yaml").current_task).toBeNull();
    expect((await s.run(["validate"])).code).toBe(0);
  });

  it("no está lista si implementa un requisito no aprobado o le faltan criterios", async () => {
    const s = await withRequirement("PROPOSED");
    const r = await s.run(["task", "ready", "TASK-001"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("FR-001, que está PROPOSED");

    const bare = await s.run(["task", "new", "--title", "Sin criterios", "--implements", "FR-001"]);
    expect(bare.out).toContain("Creada TASK-002");
    s.requirements([{ id: "FR-001", status: "APPROVED" }]);
    expect((await s.run(["task", "ready", "TASK-002"])).err).toContain("AC-1 no está definido");
  });

  it("una tarea técnica necesita justificación", async () => {
    const s = await withRequirement();
    await s.run(["task", "new", "--title", "Configurar CI", "--kind", "TECHNICAL", "--criterion", "CI en verde"]);
    expect((await s.run(["task", "ready", "TASK-002"])).err).toContain("justification sigue en UNKNOWN");
  });

  it("al agotar los intentos automáticos la tarea pasa a revisión humana", async () => {
    const s = await withRequirement();
    await s.run(["task", "ready", "TASK-001"]);
    await s.run(["task", "start", "TASK-001"]);
    await s.run(["task", "attempt", "TASK-001", "--note", "falla el test de email"]);
    await s.run(["task", "attempt", "TASK-001"]);
    const last = await s.run(["task", "attempt", "TASK-001"]);
    expect(last.out).toContain("3/3");
    expect(last.out).toContain("REQUIRES_REVIEW");
    expect(s.read(taskFile(s))).toContain("status: REQUIRES_REVIEW");
    expect((await s.run(["task", "attempt", "TASK-001"])).err).toContain("debe estar IN_PROGRESS");
  });

  it("bloquear exige motivo o dependencia, y cancelar exige motivo", async () => {
    const s = await withRequirement();
    expect((await s.run(["task", "block", "TASK-001"])).err).toContain("Indica qué bloquea");
    expect((await s.run(["task", "block", "TASK-001", "--reason", "Esperando credenciales"])).code).toBe(0);
    expect((await s.run(["task", "cancel", "TASK-001"])).code).toBe(1);
    expect((await s.run(["task", "cancel", "TASK-001", "--reason", "Fuera de alcance"])).code).toBe(0);
  });

  it("los gates configurados se ejecutan al cerrar", async () => {
    const s = await withRequirement();
    const config = s.yaml(".ai-dev/configuration.yaml");
    s.writeYaml(".ai-dev/configuration.yaml", { ...config, gate_commands: { TEST: "exit 1" } });
    await s.run(["task", "ready", "TASK-001"]);
    await s.run(["task", "start", "TASK-001"]);
    await s.run(["task", "validate", "TASK-001"]);
    await s.run(["task", "evidence", "TASK-001", "--criterion", "AC-1", "--type", "TEST_RUN", "--ref", "ok"]);
    await s.run(["task", "provenance", "TASK-001", "--generated-by", "agente"]);
    expect((await s.run(["task", "complete", "TASK-001"])).err).toContain("El gate TEST falla");
    s.writeYaml(".ai-dev/configuration.yaml", { ...config, gate_commands: { TEST: "exit 0" } });
    expect((await s.run(["task", "complete", "TASK-001"])).code).toBe(0);
  });

  it("en STANDARD exige una revisión de otra persona", async () => {
    const s = new Sandbox();
    await s.run(["init", "--name", "P", "--mode", "STANDARD", "--author", "Carla Dev"]);
    s.requirements([{ id: "FR-001", status: "APPROVED" }]);
    await s.run(["task", "new", "--title", "T", "--implements", "FR-001", "--criterion", "c", "--executor", "HUMAN", "--assignee", "Carla Dev"]);
    for (const step of ["ready", "start", "validate"]) await s.run(["task", step, "TASK-001"]);
    await s.run(["task", "evidence", "TASK-001", "--criterion", "AC-1", "--type", "MANUAL_CHECK", "--ref", "revisado"]);
    expect((await s.run(["task", "complete", "TASK-001"])).err).toContain("exige revisión");
    expect((await s.run(["task", "complete", "TASK-001", "--reviewed-by", "Carla Dev"])).err).toContain("no puede revisar su propio trabajo");
    expect((await s.run(["task", "complete", "TASK-001", "--reviewed-by", "Luis Gómez"])).code).toBe(0);
  });
});

describe("trazabilidad", () => {
  it("detecta referencias rotas, requisitos huérfanos y relaciones sin confirmar", async () => {
    const s = new Sandbox();
    await initLite(s);
    s.requirements([{ id: "FR-001", status: "APPROVED" }, { id: "FR-002", status: "APPROVED" }]);
    await s.run(["task", "new", "--title", "T1", "--implements", "FR-001", "--criterion", "c"]);

    expect((await s.run(["trace"])).out).toContain("INTEGRITY_OK");

    s.setState({ phase: "DEVELOPMENT" });
    const orphan = await s.run(["trace"]);
    expect(orphan.out).toContain("Integridad: DEGRADED");
    expect(orphan.out).toContain("FR-002 está aprobado y ninguna tarea lo implementa");
    expect(orphan.code).toBe(1);

    const file = join("docs/06-execution/tasks", readdirSync(s.path("docs/06-execution/tasks"))[0]!);
    s.editDocument(file, (d) => {
      (d.data.relations as unknown[]).push({ type: "DEPENDS_ON", target: "TASK-099" }, { type: "IMPLEMENTS", target: "FR-002", confidence: 0.7 });
    });
    const broken = await s.run(["trace", "--json"]);
    const result = JSON.parse(broken.out);
    expect(result.status).toBe("BLOCKED");
    expect(result.issues.map((i: { code: string }) => i.code)).toEqual(expect.arrayContaining(["broken_reference", "unconfirmed_relation"]));
  });

  it("con --git lee los trailers Task de los commits", async () => {
    const s = new Sandbox();
    await initLite(s);
    s.requirements([{ id: "FR-001", status: "APPROVED" }]);
    await s.run(["task", "new", "--title", "T1", "--implements", "FR-001", "--criterion", "c"]);
    s.git("init", "-q");
    s.git("add", "-A");
    s.git("commit", "-qm", "Inicio\n\nTask: TASK-001");
    s.git("commit", "-q", "--allow-empty", "-m", "Sin trailer");
    s.git("commit", "-q", "--allow-empty", "-m", "Fantasma\n\nTask: TASK-404");
    const r = JSON.parse((await s.run(["trace", "--git", "--json"])).out);
    expect(r.stats.commits).toBe(3);
    expect(r.issues.map((i: { code: string }) => i.code)).toEqual(expect.arrayContaining(["untraced_commits", "unknown_task_in_commit"]));
    expect(r.status).toBe("DEGRADED");
  });
});

describe("contexto, estado y diagnóstico", () => {
  it("context reúne la tarea, sus requisitos y las reglas que aplican", async () => {
    const s = new Sandbox();
    await initLite(s);
    s.requirements([{ id: "FR-001", status: "APPROVED" }]);
    await s.run(["task", "new", "--title", "Registro", "--implements", "FR-001", "--criterion", "Se registra", "--risk", "HIGH", "--data", "CONFIDENTIAL"]);
    const r = await s.run(["context", "TASK-001"]);
    expect(r.code).toBe(0);
    for (const text of ["# Contexto de TASK-001", "FR-001 — Requisito FR-001", "Riesgo **HIGH**", "Autonomía máxima efectiva: **2**", "Datos **CONFIDENTIAL**", "no_self_approval", "Task: TASK-001"]) {
      expect(r.out).toContain(text);
    }
    await s.run(["context", "TASK-001", "--out", "ctx.md"]);
    expect(s.read("ctx.md")).toContain("# Contexto de TASK-001");
  });

  it("status y doctor resumen el proyecto", async () => {
    const s = new Sandbox();
    await initLite(s);
    const st = await s.run(["status"]);
    expect(st.out).toContain("Gestor de Tareas (gestor-de-tareas) · modo LITE");
    expect(st.out).toContain("Fase: INTAKE");
    expect(st.out).toContain("Para cerrar INTAKE falta");
    const doc = await s.run(["doctor"]);
    expect(doc.code).toBe(0);
    expect(doc.out).toContain("igual a la de la CLI");
  });

  it("new crea documentos con el siguiente ID en su carpeta y rechaza tipos desconocidos", async () => {
    const s = new Sandbox();
    await initLite(s);
    expect((await s.run(["new", "adr", "--title", "Base de datos"])).out).toContain("ADR-001: docs/08-decisions/adr/ADR-001-base-de-datos.md");
    expect((await s.run(["new", "ADR", "--title", "Autenticación"])).out).toContain("ADR-002");
    expect((await s.run(["new", "TD", "--title", "Diseño"])).out).toContain("docs/03-architecture/TD-001-diseno.md");
    expect((await s.run(["new", "FOO", "--title", "x"])).err).toContain("Tipo de documento desconocido");
    expect((await s.run(["validate"])).code).toBe(0);
  });
});
