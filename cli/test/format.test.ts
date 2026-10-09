import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Sandbox } from "./helpers.js";

// Formateador de prueba: anota cada archivo recibido en formateados.log y, en los Markdown,
// añade una marca al final del cuerpo (una sola vez), como haría Prettier al reformatearlo.
const FORMATEADOR = `
const { appendFileSync, readFileSync, writeFileSync } = require("node:fs");
for (const f of process.argv.slice(2)) {
  appendFileSync("formateados.log", f + "\\n");
  if (f.endsWith(".md")) {
    const s = readFileSync(f, "utf8");
    if (!s.includes("<!-- formateado -->")) writeFileSync(f, s.trimEnd() + "\\n\\n<!-- formateado -->\\n");
  }
}
`;

async function project(formatCommand: string | null) {
  const s = new Sandbox();
  const init = await s.run(["init", "--name", "Gestor de Tareas", "--mode", "LITE", "--author", "Carla Dev"]);
  expect(init.code, init.err).toBe(0);
  writeFileSync(s.path("fmt.cjs"), FORMATEADOR);
  if (formatCommand) s.writeYaml(".ai-dev/configuration.yaml", { ...s.yaml<Record<string, unknown>>(".ai-dev/configuration.yaml"), format_command: formatCommand });
  return s;
}

const log = (s: Sandbox) => s.read("formateados.log").trim().split("\n");

describe("format_command", () => {
  it("formatea los archivos que escribe la CLI, incluidos los de evidencia", async () => {
    const s = await project("node fmt.cjs");
    await s.requirements([{ id: "FR-001", status: "APPROVED" }]);
    await s.run(["task", "new", "--title", "Registro", "--implements", "FR-001", "--criterion", "Se registra"]);
    writeFileSync(s.path("formateados.log"), "");

    // Una referencia con comillas simples y dobles: el YAML de la CLI y Prettier eligen
    // comillas distintas, y el gate CODE fallaba en `task complete` (ADSO Cloud, TASK-002).
    const r = await s.run(["task", "evidence", "TASK-001", "--criterion", "AC-1", "--type", "TEST_RUN", "--ref", `npm test: 'x' y "y"`]);
    expect(r.code, r.err).toBe(0);
    expect(r.err).toBe("");

    const task = join("docs/06-execution/tasks", readdirSync(s.path("docs/06-execution/tasks"))[0]!);
    expect(log(s)).toContain(task);
    expect(s.read(task)).toContain("<!-- formateado -->");
    expect((await s.run(["validate"])).code).toBe(0);
  });

  it("sin format_command no ejecuta nada", async () => {
    const s = await project(null);
    await s.run(["submit", "INTAKE-001"]);
    expect(readdirSync(s.dir)).not.toContain("formateados.log");
  });

  it("si el formateador falla, avisa y conserva lo escrito", async () => {
    const s = await project("node -e process.exit(3)");
    const r = await s.run(["submit", "INTAKE-001"]);
    expect(r.code).toBe(0);
    expect(r.err).toContain("No se pudo ejecutar format_command");
    expect(s.read("docs/00-intake/INTAKE-001-intake-gestor-de-tareas.md")).toContain("status: IN_REVIEW");
  });

  it("approve formatea el documento antes de fijar su huella: la aprobación no queda desfasada", async () => {
    const s = await project(null);
    const rel = "docs/00-intake/INTAKE-001-intake-gestor-de-tareas.md";
    await s.run(["submit", "INTAKE-001"]);
    // El formateador se configura después: el cuerpo enviado a revisión está sin formatear.
    s.writeYaml(".ai-dev/configuration.yaml", { ...s.yaml<Record<string, unknown>>(".ai-dev/configuration.yaml"), format_command: "node fmt.cjs" });

    const ok = await s.approve("INTAKE-001", "Ana Pérez", "PRODUCT_OWNER");
    expect(ok.code, ok.err).toBe(0);
    expect(s.read(rel)).toContain("<!-- formateado -->");
    const v = await s.run(["validate"]);
    expect(v.out).not.toContain("cambió después de aprobarse");
    expect(v.code, v.out).toBe(0);
  });
});
