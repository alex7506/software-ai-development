import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Sandbox } from "./helpers.js";

// Correcciones de las fricciones del piloto MiAdmin (docs/tutorial/notas-miadmin.md).

async function init(s: Sandbox, mode = "LITE") {
  const r = await s.run(["init", "--name", "Demo", "--mode", mode, "--author", "Claude Code"]);
  expect(r.code, r.err).toBe(0);
}

describe("fricción 1: entregables adicionales del proyecto", () => {
  it("phase check exige los entregables declarados en additional_deliverables", async () => {
    const s = new Sandbox();
    await init(s, "STANDARD");
    s.setState({ phase: "PLANNING" });
    expect((await s.run(["phase", "check"])).out).not.toContain("QUALITY_SECURITY");
    const config = s.yaml<Record<string, unknown>>(".ai-dev/configuration.yaml");
    s.writeYaml(".ai-dev/configuration.yaml", { ...config, additional_deliverables: [{ phase: "PLANNING", type: "QUALITY_SECURITY", reason: "Credenciales de terceros" }] });
    expect((await s.run(["validate"])).code).toBe(0);
    expect((await s.run(["phase", "check"])).out).toMatch(/✖\s+DELIVERABLE\s+QUALITY_SECURITY/);
  });
});

describe("fricción 5: proveedores de planes individuales sin entrenamiento", () => {
  it("pueden recibir datos INTERNAL pero no CONFIDENTIAL", async () => {
    const s = new Sandbox();
    await init(s);
    const config = s.yaml<Record<string, unknown>>(".ai-dev/configuration.yaml");
    s.writeYaml(".ai-dev/configuration.yaml", { ...config, providers: [{ name: "Plan individual", destination_type: "consumer_llm_no_training" }] });
    expect((await s.run(["validate"])).code).toBe(0);
    await s.run(["adapters", "sync"]);
    const agents = s.read("AGENTS.md");
    expect(agents).toMatch(/\| INTERNAL \|[^\n]*\| Plan individual \|/);
    expect(agents).toMatch(/\| CONFIDENTIAL \|[^\n]*\| — \|/);
  });
});

describe("fricción 10: cambiar el modo antes de la primera aprobación", () => {
  it("se permite sin aprobaciones y se bloquea después", async () => {
    const s = new Sandbox();
    await init(s, "STANDARD");
    expect((await s.run(["mode", "LITE"])).code).toBe(1);
    const r = await s.run(["mode", "lite", "--reason", "Piloto sin usuarios"]);
    expect(r.code, r.err).toBe(0);
    expect(r.out).toContain("STANDARD → LITE");
    expect(s.yaml<{ mode: string }>(".ai-dev/methodology.yaml").mode).toBe("LITE");

    await s.run(["submit", "INTAKE-001"]);
    await s.approve("INTAKE-001", "Ana Pérez", "PRODUCT_OWNER");
    const blocked = await s.run(["mode", "STANDARD", "--reason", "x"]);
    expect(blocked.code).toBe(1);
    expect(blocked.err).toContain("solicitud de cambio");
  });
});

describe("fricción 11: commits de documentación de la metodología", () => {
  it("no cuentan como commits sin tarea; los de código sí", async () => {
    const s = new Sandbox();
    await init(s);
    await s.requirements([{ id: "FR-001", status: "PROPOSED" }]);
    await s.run(["task", "new", "--title", "T", "--implements", "FR-001", "--criterion", "c"]);
    s.git("init", "-q");
    s.git("add", "-A");
    s.git("commit", "-qm", "Documentación inicial");
    let codes = JSON.parse((await s.run(["trace", "--git", "--json"])).out).issues.map((i: { code: string }) => i.code);
    expect(codes).not.toContain("untraced_commits");

    mkdirSync(s.path("src"));
    writeFileSync(s.path("src/app.js"), "\n");
    s.git("add", "-A");
    s.git("commit", "-qm", "Código sin tarea");
    const result = JSON.parse((await s.run(["trace", "--git", "--json"])).out);
    codes = result.issues.map((i: { code: string }) => i.code);
    expect(codes).toContain("untraced_commits");
    expect(result.issues.find((i: { code: string }) => i.code === "untraced_commits").message).toContain("1 de 2");
  });
});

describe("fricción 12: fecha de publicación de una release", () => {
  it("fijar released_at después de aprobar no invalida la aprobación", async () => {
    const s = new Sandbox();
    await init(s);
    await s.run(["new", "RELEASE", "--title", "Release"]);
    const rel = join("docs/09-release", readdirSync(s.path("docs/09-release"))[0]!);
    s.editDocument(rel, (d) => {
      d.data.validation_ref = "VAL-001";
      d.data.rollback_verified = true;
    });
    await s.run(["submit", "REL-001"]);
    expect((await s.approve("REL-001", "Ana Pérez", "PRODUCT_OWNER")).code).toBe(0);
    s.editDocument(rel, (d) => (d.data.released_at = "2026-10-09"));
    expect((await s.run(["validate"])).out).not.toContain("cambió después de aprobarse");
    s.editDocument(rel, (d) => (d.data.environment = "staging"));
    expect((await s.run(["validate"])).out).toContain("cambió después de aprobarse");
  });
});

describe("compatibilidad de huellas con la 0.9.0", () => {
  it("una aprobación registrada con la huella de la 0.9.0 sigue siendo válida", async () => {
    const { createHash } = await import("node:crypto");
    const { hashMatches } = await import("../src/core/rules.js");
    const doc = { data: { title: "Release", status: "APPROVED", released_at: "2026-10-08", environment: "development" }, content: "# Release\n" };
    // Huella tal como la calculaba la 0.9.0: excluía estado y aprobación, pero incluía released_at.
    const legacy = createHash("sha256")
      .update(JSON.stringify({ environment: "development", released_at: "2026-10-08", title: "Release" }))
      .update("\0")
      .update("# Release")
      .digest("hex")
      .slice(0, 16);
    expect(hashMatches(doc, legacy)).toBe(true);
    expect(hashMatches({ ...doc, data: { ...doc.data, title: "Otra" } }, legacy)).toBe(false);
  });
});
