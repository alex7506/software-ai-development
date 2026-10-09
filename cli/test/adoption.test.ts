import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Sandbox } from "./helpers.js";

// Adopción de proyectos existentes con su propia estructura (caso ADSO Cloud).

async function adopt(s: Sandbox, mode = "STANDARD") {
  writeFileSync(s.path("package.json"), JSON.stringify({ name: "app", devDependencies: { prettier: "^3.0.0" } }));
  mkdirSync(s.path("src"));
  writeFileSync(s.path("src/main.ts"), "\n");
  const r = await s.run(["init", "--name", "App existente", "--mode", mode, "--phase", "DEVELOPMENT", "--author", "Claude Code"]);
  expect(r.code, r.err).toBe(0);
  return r;
}

const setConfig = (s: Sandbox, changes: Record<string, unknown>) =>
  s.writeYaml(".ai-dev/configuration.yaml", { ...s.yaml<Record<string, unknown>>(".ai-dev/configuration.yaml"), ...changes });

describe("carpetas propias del proyecto (document_folders)", () => {
  it("los documentos en la carpeta declarada no generan avisos y los nuevos se crean ahí", async () => {
    const s = new Sandbox();
    await adopt(s);
    mkdirSync(s.path("docs/adr"), { recursive: true });
    setConfig(s, { document_folders: { ADR: "adr", PRD: "" } });
    const r = await s.run(["new", "ADR", "--title", "Base de datos"]);
    expect(r.out).toContain("docs/adr/ADR-001-base-de-datos.md");
    await s.run(["new", "PRD", "--title", "Brief"]);
    expect(existsSync(s.path("docs/PRD-001-brief.md"))).toBe(true);
    expect((await s.run(["validate"])).out).not.toContain("debería estar en");

    setConfig(s, { document_folders: {} });
    expect((await s.run(["validate"])).out).toContain("ADR debería estar en docs/08-decisions/adr/");
  });
});

describe("requisitos de línea base (baseline)", () => {
  it("lo implementado antes de adoptar no exige tarea; lo nuevo sí", async () => {
    const s = new Sandbox();
    await adopt(s);
    const req = (id: string, baseline: boolean) => ({ id, title: id, description: "d", status: "PROPOSED", priority: "MUST", ...(baseline ? { baseline: true } : {}), acceptance_criteria: [{ id: "AC-1", description: "c" }] });
    // La línea base se marca antes de que una persona apruebe los requisitos.
    s.writeYaml("docs/01-product/requirements.yaml", { project: "app-existente", prd_ref: "PRD-001", requirements: [req("FR-001", true), req("FR-002", false)] });
    expect((await s.approve("REQUIREMENTS", "Ana Pérez", "PRODUCT_OWNER")).code).toBe(0);

    const r = JSON.parse((await s.run(["trace", "--json"])).out);
    expect(r.status).toBe("DEGRADED");
    expect(r.issues.map((i: { message: string }) => i.message).join()).not.toContain("FR-001");
    expect(r.issues.map((i: { message: string }) => i.message).join()).toContain("FR-002");

    // Pasar la línea base a IMPLEMENTED no invalida la aprobación (el estado no forma parte de la huella).
    const file = s.yaml<{ requirements: Record<string, unknown>[] }>("docs/01-product/requirements.yaml");
    file.requirements[0]!.status = "IMPLEMENTED";
    s.writeYaml("docs/01-product/requirements.yaml", file);
    expect((await s.run(["validate"])).code).toBe(0);
  });
});

describe("formateadores", () => {
  it("init excluye de Prettier los archivos generados, sin duplicar entradas", async () => {
    const s = new Sandbox();
    writeFileSync(s.path(".prettierignore"), "dist\nnode_modules\n");
    const r = await adopt(s);
    expect(r.out).toContain(".prettierignore (archivos generados por ai-dev)");
    const ignore = readFileSync(s.path(".prettierignore"), "utf8");
    for (const f of [".ai-dev/", "AGENTS.md", "CLAUDE.md", ".claude/settings.json", ".cursor/rules/ai-dev.mdc", ".github/copilot-instructions.md", "GEMINI.md"]) {
      expect(ignore.split("\n")).toContain(f);
    }
    expect(ignore.startsWith("dist\nnode_modules\n")).toBe(true);
    await s.run(["init", "--name", "App existente", "--mode", "STANDARD", "--author", "Claude Code"]);
    expect(readFileSync(s.path(".prettierignore"), "utf8")).toBe(ignore);
  });

  it("no toca nada si el proyecto no usa Prettier", async () => {
    const s = new Sandbox();
    await s.run(["init", "--name", "Sin prettier", "--mode", "LITE"]);
    expect(existsSync(s.path(".prettierignore"))).toBe(false);
  });
});

describe("trazabilidad desde la fecha de adopción", () => {
  it("cuenta los commits del mismo día de la adopción, hechos antes de la hora actual", async () => {
    const s = new Sandbox();
    s.git("init", "-q");
    await adopt(s);
    await s.requirements([{ id: "FR-001", status: "PROPOSED" }]);
    await s.run(["task", "new", "--title", "T", "--implements", "FR-001", "--criterion", "c"]);
    // Commit fechado hoy a primera hora: antes de la corrección, `--since=<hoy>` lo excluía.
    const today = s.yaml<{ adopted_at: string }>(".ai-dev/methodology.yaml").adopted_at;
    s.git("add", "-A");
    execFileSync("git", ["commit", "-qm", "Trabajo\n\nTask: TASK-001"], {
      cwd: s.dir,
      env: { ...process.env, GIT_AUTHOR_NAME: "T", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "T", GIT_COMMITTER_EMAIL: "t@t", GIT_AUTHOR_DATE: `${today}T00:00:30`, GIT_COMMITTER_DATE: `${today}T00:00:30` },
    });
    const r = JSON.parse((await s.run(["trace", "--git", "--json"])).out);
    expect(r.stats.commits).toBe(1);
  });
});

describe("fechas locales", () => {
  it("today() usa el calendario local, no UTC", async () => {
    const { today } = await import("../src/core/ids.js");
    // 23:30 del 8 de octubre en hora local: en UTC ya puede ser el día 9.
    const late = new Date(2026, 9, 8, 23, 30);
    expect(today(late)).toBe("2026-10-08");
  });
});
