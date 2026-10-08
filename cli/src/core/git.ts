import { execFileSync } from "node:child_process";

export interface Commit {
  hash: string;
  author: string;
  date: string;
  message: string;
  tasks: string[];
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

/** Tareas declaradas con trailers `Task: TASK-NNN` (se admiten varias). */
export function taskTrailers(message: string): string[] {
  return [...message.matchAll(/^Task:\s*(TASK-[0-9]{3}[A-Z]?)\s*$/gim)].map((m) => m[1]!.toUpperCase());
}

/** Commits del repositorio, opcionalmente desde una fecha (YYYY-MM-DD). Vacío si no hay historial. */
export function commits(cwd: string, since?: string | null): Commit[] {
  let raw: string;
  try {
    raw = git(cwd, ["log", "--format=%H%x1f%an%x1f%aI%x1f%B%x1e", ...(since ? [`--since=${since}`] : [])]);
  } catch {
    return [];
  }
  return raw
    .split("\x1e")
    .map((r) => r.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash = "", author = "", date = "", message = ""] = record.split("\x1f");
      return { hash, author, date, message, tasks: taskTrailers(message) };
    });
}
