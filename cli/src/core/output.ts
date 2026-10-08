import type { Issue } from "./issues.js";

const SYMBOL: Record<Issue["level"], string> = { ERROR: "✖", WARNING: "▲", INFO: "✔" };

export function formatIssues(issues: Issue[]): string {
  return issues.map((i) => `${SYMBOL[i.level]} ${i.message}${i.file ? `  (${i.file})` : ""}`).join("\n");
}

export function summary(issues: Issue[]): string {
  const errors = issues.filter((i) => i.level === "ERROR").length;
  const warnings = issues.filter((i) => i.level === "WARNING").length;
  return `${errors} errores, ${warnings} advertencias`;
}

export function table(rows: string[][]): string {
  const widths = rows[0]?.map((_, c) => Math.max(...rows.map((r) => (r[c] ?? "").length))) ?? [];
  return rows.map((r) => r.map((cell, c) => cell.padEnd(widths[c] ?? 0)).join("  ").trimEnd()).join("\n");
}
