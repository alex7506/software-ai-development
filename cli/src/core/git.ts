import { execFileSync } from "node:child_process";

export interface Commit {
  hash: string;
  author: string;
  date: string;
  message: string;
  tasks: string[];
  /** Otros documentos que el commit declara con trailers `Release:` o `Change:`. */
  refs: string[];
  files: string[];
}

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
}

export function isGitRepo(cwd: string): boolean {
  try {
    return git(cwd, ["rev-parse", "--is-inside-work-tree"]).trim() === "true";
  } catch {
    return false;
  }
}

export function gitUserName(cwd: string): string | null {
  try {
    return git(cwd, ["config", "user.name"]).trim() || null;
  } catch {
    return null;
  }
}

/**
 * IDs de los documentos (`TASK-007-titulo.md` → TASK-007) que existen en la punta de cada rama
 * local y remota bajo `folder`. Sirve para no repetir un ID que otra rama paralela ya usa.
 * Las ramas remotas son las del último `git fetch`. Vacío fuera de un repositorio git.
 */
export function documentIdsInBranches(cwd: string, folder: string): string[] {
  let refs: string[];
  try {
    refs = git(cwd, ["for-each-ref", "--format=%(refname)", "refs/heads", "refs/remotes"]).split("\n").filter((r) => r && !r.endsWith("/HEAD"));
  } catch {
    return [];
  }
  const ids = new Set<string>();
  for (const ref of refs) {
    let files: string;
    try {
      files = git(cwd, ["ls-tree", "-r", "--name-only", ref, "--", folder]);
    } catch {
      continue;
    }
    for (const file of files.split("\n")) {
      const m = /(?:^|\/)([A-Z]+-\d{3,}[A-Z]?)-[^/]*\.md$/.exec(file);
      if (m) ids.add(m[1]!);
    }
  }
  return [...ids];
}

/** Tareas declaradas con trailers `Task: TASK-NNN` (se admiten varias). */
export function taskTrailers(message: string): string[] {
  return [...message.matchAll(/^Task:\s*(TASK-[0-9]{3}[A-Z]?)\s*$/gim)].map((m) => m[1]!.toUpperCase());
}

/** Releases y solicitudes de cambio declaradas con trailers `Release: REL-NNN` o `Change: CHANGE-NNN`. */
export function documentTrailers(message: string): string[] {
  return [...message.matchAll(/^(?:Release|Change):\s*((?:REL|CHANGE)-[0-9]{3}[A-Z]?)\s*$/gim)].map((m) => m[1]!.toUpperCase());
}

/** Commits del repositorio con sus archivos, opcionalmente desde una fecha (YYYY-MM-DD). Vacío si no hay historial. */
export function commits(cwd: string, since?: string | null): Commit[] {
  let raw: string;
  try {
    // Una fecha sin hora la interpreta git como ese día a la hora actual: se fija el inicio del día.
    const from = since && /^\d{4}-\d{2}-\d{2}$/.test(since) ? `${since}T00:00:00` : since;
    // Los commits de fusión (incluido el que crea la CI de un PR) no aportan cambios propios: se excluyen.
    raw = git(cwd, ["log", "--no-merges", "--name-only", "--format=%x1e%H%x1f%an%x1f%aI%x1f%B%x1f", ...(from ? [`--since=${from}`] : [])]);
  } catch {
    return [];
  }
  return raw
    .split("\x1e")
    .filter((r) => r.trim())
    .map((record) => {
      const [hash = "", author = "", date = "", message = "", files = ""] = record.split("\x1f");
      return { hash, author, date, message: message.trim(), tasks: taskTrailers(message), refs: documentTrailers(message), files: files.split("\n").map((f) => f.trim()).filter(Boolean) };
    });
}

/** Documentación y configuración de la metodología y del repositorio: su trabajo pertenece a las fases, no a una tarea concreta. */
const METHODOLOGY_PATHS = [/^\.gitignore$/, /^README\.md$/, /^CHANGELOG\.md$/, /^LICENSE(\.md)?$/, /^docs\//, /^\.ai-dev\//, /^AI-CONTEXT\.md$/, /^AGENTS\.md$/, /^CLAUDE\.md$/, /^GEMINI\.md$/, /^\.claude\//, /^\.cursor\/rules\//, /^\.github\/copilot-instructions\.md$/];

/** Commit que solo toca documentación y configuración de la metodología. */
export function isMethodologyOnly(commit: Commit): boolean {
  return commit.files.length > 0 && commit.files.every((f) => METHODOLOGY_PATHS.some((re) => re.test(f)));
}
