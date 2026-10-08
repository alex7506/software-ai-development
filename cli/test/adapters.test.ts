import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Sandbox } from "./helpers.js";

const ALL_FILES = ["AGENTS.md", "CLAUDE.md", ".claude/settings.json", ".cursor/rules/ai-dev.mdc", ".github/copilot-instructions.md", "GEMINI.md"];

async function init(s: Sandbox, extra: string[] = []) {
  const r = await s.run(["init", "--name", "Demo", "--mode", "STANDARD", "--author", "Carla Dev", ...extra]);
  expect(r.code, r.err).toBe(0);
  return r;
}

const statuses = async (s: Sandbox) => JSON.parse((await s.run(["adapters", "status", "--json"])).out) as { target: string; status: string }[];

describe("adaptadores", () => {
  it("init genera los archivos de todos los asistentes, sin marcadores sin resolver", async () => {
    const s = new Sandbox();
    await init(s);
    for (const f of ALL_FILES) expect(existsSync(s.path(f)), f).toBe(true);
    for (const f of ALL_FILES.filter((f) => !f.endsWith(".json"))) expect(s.read(f)).not.toContain("{{");
    expect((await statuses(s)).every((x) => x.status === "UP_TO_DATE")).toBe(true);

    const agents = s.read("AGENTS.md");
    for (const text of ["Reglas de trabajo para agentes de IA — Demo", "modo **STANDARD**", "`no_self_approval`", "## Lo que nunca haces", "ai-dev context TASK-NNN", "requiere la revisión de una persona distinta"]) {
      expect(agents).toContain(text);
    }
    expect(s.read("CLAUDE.md")).toContain("@AGENTS.md");
    expect(s.read("GEMINI.md")).toContain("@./AGENTS.md");
    expect(s.read(".cursor/rules/ai-dev.mdc")).toMatch(/^---\ndescription: .+\nglobs:\nalwaysApply: true\n---/);
    expect(s.read(".github/copilot-instructions.md")).toContain("`no_self_approval`");

    const settings = JSON.parse(s.read(".claude/settings.json"));
    expect(settings.permissions.deny).toEqual(expect.arrayContaining(["Bash(ai-dev approve *)", "Edit(/.ai-dev/approvals.yaml)", "Read(.env)"]));
    expect(settings.permissions.ask).toContain("Bash(git push *)");

    const v = await s.run(["validate"]);
    expect(v.out).not.toContain("Adaptador");
  });

  it("sync es idempotente", async () => {
    const s = new Sandbox();
    await init(s);
    const r = await s.run(["adapters", "sync"]);
    expect(r.code).toBe(0);
    expect(r.out.match(/UNCHANGED/g)).toHaveLength(ALL_FILES.length);
  });

  it("refleja los cambios de configuración: proveedores y políticas locales", async () => {
    const s = new Sandbox();
    await init(s);
    const config = s.yaml(".ai-dev/configuration.yaml");
    s.writeYaml(".ai-dev/configuration.yaml", { ...config, providers: [{ name: "Anthropic Enterprise", destination_type: "enterprise_llm" }] });
    s.writeYaml(".ai-dev/policies.yaml", { local_policies: [{ id: "local_no_prod_db", severity: "BLOCKING", description: "Nada de bases de datos de producción." }] });

    expect((await statuses(s)).find((x) => x.target === "AGENTS.md")?.status).toBe("OUTDATED");
    expect((await s.run(["validate"])).out).toContain("AGENTS.md está OUTDATED");
    const r = await s.run(["adapters", "sync"]);
    expect(r.out).toContain("UPDATED");
    const agents = s.read("AGENTS.md");
    expect(agents).toContain("| CONFIDENTIAL | `local_model`, `enterprise_llm` | Anthropic Enterprise |");
    expect(agents).toContain("`local_no_prod_db` (política local)");
    // CLAUDE.md solo importa AGENTS.md: no cambia.
    expect(r.out).toMatch(/claude-code\s+CLAUDE\.md\s+UNCHANGED/);
  });

  it("no pisa un bloque editado a mano salvo con --force, y conserva el texto propio fuera del bloque", async () => {
    const s = new Sandbox();
    await init(s);
    writeFileSync(s.path("CLAUDE.md"), `${s.read("CLAUDE.md")}\nUsa siempre pnpm.\n`);
    writeFileSync(s.path("AGENTS.md"), s.read("AGENTS.md").replace("## Antes de empezar", "## Antes de empezar (editado)"));

    expect((await statuses(s)).find((x) => x.target === "AGENTS.md")?.status).toBe("MODIFIED");
    const skipped = await s.run(["adapters", "sync"]);
    expect(skipped.code).toBe(1);
    expect(skipped.out).toContain("se editó a mano");
    expect(s.read("AGENTS.md")).toContain("(editado)");

    const forced = await s.run(["adapters", "sync", "--force"]);
    expect(forced.code).toBe(0);
    expect(s.read("AGENTS.md")).not.toContain("(editado)");
    expect(s.read("CLAUDE.md")).toContain("Usa siempre pnpm.");
  });

  it("en un proyecto existente añade el bloque a CLAUDE.md y fusiona los permisos sin borrar los del usuario", async () => {
    const s = new Sandbox();
    mkdirSync(s.path(".claude"));
    writeFileSync(s.path("CLAUDE.md"), "# Mi proyecto\n\nInstrucciones previas.\n");
    writeFileSync(s.path(".claude/settings.json"), JSON.stringify({ model: "opus", permissions: { allow: ["Bash(npm test)"], deny: ["Read(./secrets/**)"] } }));
    writeFileSync(s.path("index.js"), "\n");
    const r = await init(s, ["--phase", "DEVELOPMENT"]);
    expect(r.out).toContain("CLAUDE.md (bloque añadido)");
    expect(r.out).toContain(".claude/settings.json (permisos añadidos)");

    const claude = s.read("CLAUDE.md");
    expect(claude.startsWith("# Mi proyecto\n\nInstrucciones previas.\n")).toBe(true);
    expect(claude).toContain("@AGENTS.md");
    const settings = JSON.parse(s.read(".claude/settings.json"));
    expect(settings.model).toBe("opus");
    expect(settings.permissions.allow).toEqual(["Bash(npm test)"]);
    expect(settings.permissions.deny[0]).toBe("Read(./secrets/**)");
    expect(settings.permissions.deny).toContain("Bash(ai-dev approve *)");
    expect((await s.run(["adapters", "sync"])).out).not.toContain("MERGED");
  });

  it("un settings.json inválido no se toca y se reporta", async () => {
    const s = new Sandbox();
    await init(s);
    writeFileSync(s.path(".claude/settings.json"), "{ roto");
    const r = await s.run(["adapters", "sync"]);
    expect(r.code).toBe(1);
    expect(r.out).toContain("JSON inválido");
    expect(s.read(".claude/settings.json")).toBe("{ roto");
    expect((await s.run(["validate"])).code).toBe(1);
  });

  it("solo genera los adaptadores elegidos, y AGENTS.md siempre", async () => {
    const s = new Sandbox();
    await init(s, ["--adapters", "claude-code"]);
    expect(existsSync(s.path("AGENTS.md"))).toBe(true);
    expect(existsSync(s.path("CLAUDE.md"))).toBe(true);
    expect(existsSync(s.path(".cursor"))).toBe(false);
    expect(existsSync(s.path("GEMINI.md"))).toBe(false);
    expect((await s.run(["init", "--name", "X", "--adapters", "vscode"], { cwd: new Sandbox().dir })).code).toBe(1);
  });

  it("BOOTSTRAPPING exige adaptadores al día", async () => {
    const s = new Sandbox();
    await init(s);
    s.setState({ phase: "BOOTSTRAPPING" });
    expect((await s.run(["phase", "check"])).out).toMatch(/✔\s+CHECK\s+adapters_generated/);
    writeFileSync(s.path("GEMINI.md"), s.read("GEMINI.md").replace("obligatorias", "opcionales"));
    expect((await s.run(["phase", "check"])).out).toMatch(/✖\s+CHECK\s+adapters_generated\s+.*GEMINI\.md \(MODIFIED\)/);
  });
});
