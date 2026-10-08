/** Sustituye marcadores `{{clave}}`. Un marcador sin valor se deja intacto para detectarlo después. */
export function renderTemplate(source: string, values: Record<string, string>): string {
  return source.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (match, key: string) => values[key] ?? match);
}

export function unresolvedPlaceholders(source: string): string[] {
  return [...new Set([...source.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/g)].map((m) => m[1]!))];
}
