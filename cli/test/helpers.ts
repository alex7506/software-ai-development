import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli, type Env } from "../src/cli.js";
import { parseMarkdown, parseYaml, stringifyMarkdown, stringifyYaml } from "../src/core/yaml.js";

export interface Run {
  code: number;
  out: string;
  err: string;
}

export class Sandbox {
  readonly dir = mkdtempSync(join(tmpdir(), "ai-dev-test-"));
  private clock = new Date("2026-10-08T10:00:00Z");

  /** Ejecuta la CLI. `answers` simula a una persona respondiendo en una terminal interactiva. */
  async run(args: string[], opts: { answers?: string[]; cwd?: string } = {}): Promise<Run> {
    const out: string[] = [];
    const err: string[] = [];
    const answers = [...(opts.answers ?? [])];
    const env: Env = {
      cwd: opts.cwd ?? this.dir,
      now: () => (this.clock = new Date(this.clock.getTime() + 1000)),
      out: (t) => out.push(t),
      err: (t) => err.push(t),
      interactive: opts.answers !== undefined,
      ask: async () => answers.shift() ?? "",
    };
    const code = await runCli(args, env);
    return { code, out: out.join("\n"), err: err.join("\n") };
  }

  /** Aprobación hecha por una persona (terminal interactiva con confirmación correcta). */
  approve(target: string, by: string, role: string, extra: string[] = []): Promise<Run> {
    return this.run(["approve", target, "--by", by, "--role", role, ...extra], { answers: [by] });
  }

  path(rel: string): string {
    return join(this.dir, rel);
  }

  read(rel: string): string {
    return readFileSync(this.path(rel), "utf8");
  }

  yaml<T = Record<string, unknown>>(rel: string): T {
    return parseYaml<T>(this.read(rel));
  }

  writeYaml(rel: string, data: unknown): void {
    writeFileSync(this.path(rel), stringifyYaml(data));
  }

  /** Modifica el frontmatter o el cuerpo de un documento, como haría una persona o un agente editando el archivo. */
  editDocument(rel: string, edit: (doc: { data: Record<string, unknown>; content: string }) => void): void {
    const doc = parseMarkdown(this.read(rel));
    edit(doc);
    writeFileSync(this.path(rel), stringifyMarkdown(doc));
  }

  setState(changes: Record<string, unknown>): void {
    this.writeYaml(".ai-dev/state.yaml", { ...this.yaml<Record<string, unknown>>(".ai-dev/state.yaml"), ...changes });
  }

  requirements(reqs: { id: string; status: string }[]): void {
    this.writeYaml("docs/01-product/requirements.yaml", {
      project: this.yaml<{ project: { id: string } }>(".ai-dev/methodology.yaml").project.id,
      prd_ref: "PRD-001",
      requirements: reqs.map((r) => ({
        id: r.id,
        title: `Requisito ${r.id}`,
        description: "Descripción",
        status: r.status,
        priority: "MUST",
        acceptance_criteria: [{ id: "AC-1", description: "Se cumple" }],
      })),
    });
  }

  git(...args: string[]): string {
    return execFileSync("git", args, {
      cwd: this.dir,
      encoding: "utf8",
      env: { ...process.env, GIT_AUTHOR_NAME: "Test", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "Test", GIT_COMMITTER_EMAIL: "t@t" },
    });
  }
}

export const firstLine = (s: string) => s.split("\n")[0] ?? "";
