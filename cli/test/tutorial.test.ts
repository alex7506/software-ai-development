import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Sandbox } from "./helpers.js";

/**
 * Reproduce, paso a paso, el tutorial docs/tutorial/primer-proyecto.md (basado en el piloto MiAdmin):
 * un proyecto LITE de INTAKE a EVOLUTION con un agente que redacta e implementa y una persona que aprueba.
 * Si un paso del tutorial deja de funcionar, esta prueba falla.
 */
describe("tutorial: primer proyecto de principio a fin", () => {
  it("recorre el ciclo completo con dos sesiones de revisión", async () => {
    const s = new Sandbox();
    const agent = "Claude Code";
    const person = "Ana Pérez";
    const ok = async (args: string[]) => {
      const r = await s.run(args);
      expect(r.code, `${args.join(" ")}\n${r.err}\n${r.out}`).toBe(0);
      return r;
    };
    const review = async () => {
      const r = await s.run(["review", "--by", person, "--roles", "PRODUCT_OWNER,TECH_LEAD,QA_LEAD"], { answers: [person, ...Array(30).fill("s")] });
      expect(r.code, r.err).toBe(0);
      return r;
    };
    const phase = () => s.yaml<{ phase: string }>(".ai-dev/state.yaml").phase;
    const doc = (folder: string, id: string) => join("docs", folder, readdirSync(s.path(join("docs", folder))).find((f) => f.startsWith(id))!);

    // 1. Crear el proyecto (paso 1 del tutorial).
    s.git("init", "-q");
    await ok(["init", "--name", "Bóveda", "--mode", "LITE", "--author", agent]);

    // 2. El agente redacta y envía a revisión los documentos hasta la planificación (pasos 2 y 3).
    await ok(["submit", "INTAKE-001"]);
    for (const [type, title] of [["PRD", "Bóveda de sitios"], ["ARCHITECTURE", "Arquitectura"], ["IMPLEMENTATION_PLAN", "Plan"]]) {
      await ok(["new", type!, "--title", title!, "--author", agent]);
    }
    for (const id of ["PRD-001", "ARCH-001", "PLAN-001"]) await ok(["submit", id]);
    await s.requirements([{ id: "FR-001", status: "PROPOSED" }]);
    s.writeYaml(".ai-dev/methodology.yaml", { ...s.yaml<Record<string, unknown>>(".ai-dev/methodology.yaml"), technology_profile: "vite-typescript-local" });
    await ok(["task", "new", "--title", "Clave maestra", "--implements", "FR-001", "--criterion", "Se crea la clave maestra", "--author", agent]);
    expect((await ok(["validate"])).out).toContain("0 errores");

    // 3. Primera sesión de revisión: la persona aprueba todo y el proyecto llega a DEVELOPMENT (paso 4).
    const first = await review();
    expect(first.out).toContain("Fase BOOTSTRAPPING cerrada. Fase actual: DEVELOPMENT");
    expect(phase()).toBe("DEVELOPMENT");

    // 4. El agente implementa la tarea con su evidencia (paso 5).
    await ok(["task", "ready", "TASK-001"]);
    await ok(["task", "start", "TASK-001"]);
    expect((await ok(["context", "TASK-001"])).out).toContain("FR-001");
    writeFileSync(s.path("vault.js"), "export const vault = {};\n");
    s.git("add", "-A");
    s.git("commit", "-qm", "Clave maestra\n\nTask: TASK-001");
    await ok(["task", "evidence", "TASK-001", "--criterion", "AC-1", "--type", "TEST_RUN", "--ref", "npm test — 1 passed"]);
    await ok(["task", "provenance", "TASK-001", "--generated-by", "claude-code", "--model", "claude-opus-5-5"]);
    await ok(["task", "validate", "TASK-001"]);
    await ok(["task", "complete", "TASK-001"]);

    // 5. Validación y release (paso 6).
    await ok(["new", "VALIDATION_REPORT", "--title", "Validación v0.1.0", "--author", agent]);
    await ok(["new", "RELEASE", "--title", "Release v0.1.0", "--author", agent]);
    s.editDocument(doc("09-release", "VAL-001"), (d) => {
      d.data.outcome = "APPROVED";
      d.data.checks = [{ target: "FR-001", result: "PASS", evidence: [{ criterion: "AC-1", type: "TEST_RUN", ref: "npm test" }] }];
    });
    s.editDocument(doc("09-release", "REL-001"), (d) => {
      d.data.validation_ref = "VAL-001";
      d.data.rollback_verified = true;
    });
    await ok(["submit", "VAL-001"]);
    await ok(["submit", "REL-001"]);

    // 6. Segunda sesión de revisión: hasta EVOLUTION (paso 7).
    const second = await review();
    expect(second.out).toContain("Fase RELEASE cerrada. Fase actual: EVOLUTION");
    expect(phase()).toBe("EVOLUTION");
    expect((await ok(["status"])).out).toContain("es la fase de operación");
    expect((await ok(["validate"])).out).toContain("0 errores");
    const trace = JSON.parse((await s.run(["trace", "--git", "--json"])).out);
    expect(trace.meetsMinimum).toBe(true);
    expect(s.yaml<{ approvals: { by: string }[] }>(".ai-dev/approvals.yaml").approvals.every((a) => a.by === person)).toBe(true);
  });
});
