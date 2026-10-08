export type IssueLevel = "ERROR" | "WARNING" | "INFO";

export interface Issue {
  level: IssueLevel;
  code: string;
  message: string;
  file?: string;
}

export const error = (code: string, message: string, file?: string): Issue => ({ level: "ERROR", code, message, file });
export const warning = (code: string, message: string, file?: string): Issue => ({ level: "WARNING", code, message, file });
export const info = (code: string, message: string, file?: string): Issue => ({ level: "INFO", code, message, file });

export const hasErrors = (issues: Issue[]) => issues.some((i) => i.level === "ERROR");

/** Error esperado de uso: se muestra al usuario sin traza y termina con código 1. */
export class CliError extends Error {}
