import type { Command, Option } from "commander";
import type { Catalog } from "../core/catalog.js";

const HEADER = "<!-- Generado por `npm run docs:gen` desde la CLI y methodology/catalog. No editar a mano. -->\n\n";

/** Referencia del manual (ruta relativa a docs/referencia → contenido), derivada de la CLI y del catálogo. */
export function generateReference(cat: Catalog, program: Command): Map<string, string> {
  const files = new Map<string, string>();
  const commands = program.commands as Command[];

  files.set(
    "README.md",
    `${HEADER}# Referencia\n\nDatos exactos, generados automáticamente. Para entender el porqué, ver [Conceptos](../conceptos/).\n\n` +
      `## CLI\n\n[Índice de comandos](cli/README.md)\n\n## Catálogo\n\n` +
      CATALOG_PAGES.map(([file, title]) => `- [${title}](catalogo/${file})`).join("\n") +
      "\n",
  );

  files.set(
    "cli/README.md",
    `${HEADER}# Comandos de \`ai-dev\`\n\n${program.description()}\n\n| Comando | Descripción |\n|---|---|\n` +
      commands.map((c) => `| [\`${c.name()}\`](${c.name()}.md) | ${escape(c.description())} |`).join("\n") +
      "\n\nOpciones globales: `-v, --version`, `-h, --help` (también en cada comando).\n",
  );
  for (const cmd of commands) files.set(`cli/${cmd.name()}.md`, HEADER + commandPage(cmd, ["ai-dev"]));

  const [states, phases, modes, types, risk, policies, definitions] = CATALOG_PAGES.map(([file]) => file);
  files.set(`catalogo/${states}`, HEADER + statesPage(cat));
  files.set(`catalogo/${phases}`, HEADER + phasesPage(cat));
  files.set(`catalogo/${modes}`, HEADER + modesPage(cat));
  files.set(`catalogo/${types}`, HEADER + typesPage(cat));
  files.set(`catalogo/${risk}`, HEADER + riskPage(cat));
  files.set(`catalogo/${policies}`, HEADER + policiesPage(cat));
  files.set(`catalogo/${definitions}`, HEADER + definitionsPage(cat));
  return files;
}

const CATALOG_PAGES: [string, string][] = [
  ["estados.md", "Estados y transiciones"],
  ["fases.md", "Fases"],
  ["modos.md", "Modos de rigor"],
  ["tipos-de-documento.md", "Tipos de documento"],
  ["riesgo-y-datos.md", "Riesgo, autonomía y clasificación de datos"],
  ["politicas.md", "Políticas y roles"],
  ["definiciones.md", "Definition of Ready y Definition of Done"],
];

function commandPage(cmd: Command, parents: string[], level = 1): string {
  const path = [...parents, cmd.name()];
  const args = (cmd.registeredArguments ?? []).map((a) => (a.required ? `<${a.name()}>` : `[${a.name()}]`));
  const opts = (cmd.options as Option[]).filter((o) => o.long !== "--help");
  let out = `${"#".repeat(level)} \`${path.join(" ")}\`\n\n${cmd.description()}\n\n`;
  const subs = cmd.commands as Command[];
  if (!subs.length) out += `\`\`\`\n${[...path, ...args, opts.length ? "[opciones]" : ""].filter(Boolean).join(" ")}\n\`\`\`\n\n`;
  if (cmd.registeredArguments?.length) {
    out += `**Argumentos**\n\n| Argumento | Descripción |\n|---|---|\n`;
    out += cmd.registeredArguments.map((a) => `| \`${a.name()}\`${a.required ? "" : " (opcional)"} | ${escape(a.description)}${a.defaultValue !== undefined ? ` Por defecto: \`${String(a.defaultValue)}\`.` : ""} |`).join("\n");
    out += "\n\n";
  }
  if (opts.length) {
    out += `**Opciones**\n\n| Opción | Descripción |\n|---|---|\n`;
    out += opts.map((o) => `| \`${o.flags}\`${o.mandatory ? " (obligatoria)" : ""} | ${escape(optionDescription(o))} |`).join("\n");
    out += "\n\n";
  }
  for (const sub of subs) out += commandPage(sub, path, level + 1);
  return out;
}

function optionDescription(o: Option): string {
  const extra: string[] = [];
  if (o.argChoices) extra.push(`Valores: ${o.argChoices.map((c) => `\`${c}\``).join(", ")}.`);
  if (o.defaultValue !== undefined && typeof o.defaultValue !== "object") extra.push(`Por defecto: \`${String(o.defaultValue)}\`.`);
  return [o.description.replace(/([^.])$/, "$1."), ...extra].join(" ");
}

function statesPage(cat: Catalog): string {
  let out = "# Estados y transiciones\n\nFuente: `methodology/catalog/states.yaml`.\n\n";
  for (const [name, def] of Object.entries(cat.states)) {
    if (!def || typeof def !== "object" || !Array.isArray(def.values)) continue;
    out += `## \`${name}\`\n\n${def.values.map((v) => `\`${v}\``).join(" · ")}\n\n`;
    const transitions = (def as { transitions?: Record<string, string[]> }).transitions;
    if (transitions) {
      out += "| Desde | Puede pasar a |\n|---|---|\n";
      out += Object.entries(transitions).map(([from, to]) => `| \`${from}\` | ${to.length ? to.map((t) => `\`${t}\``).join(", ") : "— (final)"} |`).join("\n");
      out += "\n\n";
    }
    if (typeof def.notes === "string") out += `> ${def.notes.trim()}\n\n`;
  }
  return out;
}

function phasesPage(cat: Catalog): string {
  let out = `# Fases\n\nFuente: \`methodology/catalog/phases.yaml\`.\n\n${cat.phases.order.join(" → ")}\n\n`;
  out += "Un entregable es obligatorio si el modo del proyecto es igual o superior a su modo mínimo y, si tiene condición, la característica está activa en `.ai-dev/configuration.yaml`.\n\n";
  for (const name of cat.phases.order) {
    const p = cat.phases.phases[name] as Record<string, unknown> & { deliverables: { type: string; min_mode: string; when?: string }[]; approver: string; gates?: string[] };
    out += `## ${name}\n\n${String(p.purpose)}\n\n`;
    out += `- **Entrada:** ${String(p.entry)}\n- **Salida:** ${String(p.exit)}\n- **Aprueba:** \`${p.approver}\`\n`;
    if (p.gates?.length) out += `- **Gates:** ${p.gates.map((g) => `\`${g}\``).join(", ")}\n`;
    if ((p.checks as string[] | undefined)?.length) out += `- **Comprobaciones:** ${(p.checks as string[]).map((c) => `\`${c}\``).join(", ")}\n`;
    if (p.deliverables.length) {
      out += "\n| Entregable | Desde el modo | Condición |\n|---|---|---|\n";
      out += p.deliverables.map((d) => `| \`${d.type}\` | ${d.min_mode} | ${d.when ? `\`${d.when}\`` : "—"} |`).join("\n");
      out += "\n";
    }
    out += "\n";
  }
  out += "## Gates\n\n| Gate | Qué exige |\n|---|---|\n";
  out += Object.entries(cat.phases.gates).map(([g, d]) => `| \`${g}\` | ${escape(d)} |`).join("\n");
  out += "\n\n## Características del producto\n\n| Característica | Significado |\n|---|---|\n";
  out += Object.entries(cat.phases.project_features).map(([f, d]) => `| \`${f}\` | ${escape(d)} |`).join("\n");
  return `${out}\n`;
}

function modesPage(cat: Catalog): string {
  let out = "# Modos de rigor\n\nFuente: `methodology/catalog/modes.yaml`.\n\n| | " + cat.modes.order.join(" | ") + " |\n|---|" + cat.modes.order.map(() => "---|").join("") + "\n";
  const modes = cat.modes.order.map((m) => cat.modes.modes[m] as Record<string, unknown>);
  const row = (label: string, f: (m: Record<string, unknown>) => string) => `| **${label}** | ${modes.map((m) => escape(f(m))).join(" | ")} |\n`;
  out += row("Para qué", (m) => String(m.purpose));
  out += row("Aprobaciones", (m) => String(m.approvals));
  out += row("Separación de funciones", (m) => (m.separation_of_duties ? "Sí" : "No"));
  out += row("Trazabilidad mínima", (m) => `\`${String(m.traceability_minimum)}\``);
  out += row("Gates", (m) => (m.gates_required as string[]).join(", "));
  out += row("Autonomía máxima", (m) => String(m.max_autonomy_level));
  out += row("Doble aprobación", (m) => ((m.dual_approval_phases as string[] | undefined) ?? []).join(", ") || "—");
  return out;
}

function typesPage(cat: Catalog): string {
  let out = "# Tipos de documento\n\nFuente: `methodology/catalog/document-types.yaml`. Crear: `ai-dev new <tipo> --title \"...\"`.\n\n";
  out += "| Tipo | Prefijo de ID | Carpeta | Plantilla | Esquema |\n|---|---|---|---|---|\n";
  out += Object.entries(cat.documentTypes.types)
    .map(([t, d]) => `| \`${t}\` | \`${d.id_prefix}\` | \`docs/${d.folder}/\` | \`templates/documents/${d.template}\` | \`${d.schema ?? cat.documentTypes.default_schema}\` |`)
    .join("\n");
  return `${out}\n\nLos requisitos (\`FR-NNN\`, \`NFR-NNN\`) viven en \`docs/01-product/requirements.yaml\`.\n`;
}

function riskPage(cat: Catalog): string {
  let out = "# Riesgo, autonomía y clasificación de datos\n\nFuentes: `methodology/catalog/risk.yaml`, `methodology/catalog/data-classification.yaml`, `agents/capabilities.yaml`.\n\n";
  out += "## Niveles de riesgo\n\n| Riesgo | Autonomía máxima | Aprobación |\n|---|---|---|\n";
  out += Object.entries(cat.risk.levels).map(([r, d]) => `| \`${r}\` | ${d.max_autonomy_level} | \`${d.approval}\` |`).join("\n");
  out += "\n\n## Capacidades\n\n| Capacidad | Riesgo base |\n|---|---|\n";
  out += Object.entries(cat.capabilities.capabilities).map(([c, d]) => `| \`${c}\` | \`${d.risk}\`${d.human_only ? " (solo personas)" : ""} |`).join("\n");
  out += "\n\n## Clasificación de datos\n\n| Nivel | Riesgo | Destinos permitidos |\n|---|---|---|\n";
  out += Object.entries(cat.dataClassification.levels).map(([l, d]) => `| \`${l}\` | \`${d.risk}\` | ${d.allowed_destinations.map((x) => `\`${x}\``).join(", ") || "ninguno"} |`).join("\n");
  out += "\n\n## Tipos de destino\n\n| Destino | Significado |\n|---|---|\n";
  out += Object.entries(cat.dataClassification.destination_types).map(([t, d]) => `| \`${t}\` | ${escape(d)} |`).join("\n");
  return `${out}\n`;
}

function policiesPage(cat: Catalog): string {
  let out = "# Políticas y roles\n\nFuentes: `agents/policies/agent-policies.yaml`, `methodology/catalog/roles.yaml`.\n\n## Políticas\n\n| Política | Severidad | Descripción |\n|---|---|---|\n";
  out += cat.policies.policies.map((p) => `| \`${p.id}\` | ${p.severity} | ${escape(String((p as { description?: string }).description ?? ""))} |`).join("\n");
  out += "\n\n## Roles\n\n| Rol | Solo personas | Aprueba |\n|---|---|---|\n";
  out += Object.entries(cat.roles.roles).map(([r, d]) => `| \`${r}\` | ${d.human_only ? "Sí" : "No"} | ${(d.approves ?? []).join(", ") || "—"} |`).join("\n");
  return `${out}\n`;
}

function definitionsPage(cat: Catalog): string {
  const list = (items: { id: string }[]) =>
    "| Criterio | Automático | Descripción |\n|---|---|---|\n" +
    items.map((i) => { const d = i as { id: string; automated?: boolean; description?: string }; return `| \`${d.id}\` | ${d.automated ? "Sí" : "No"} | ${escape(d.description ?? "")} |`; }).join("\n");
  let out = "# Definition of Ready y Definition of Done\n\nFuente: `methodology/catalog/definitions.yaml`.\n\n";
  out += `## Definition of Ready\n\nSe comprueba con \`ai-dev task ready\`.\n\n${list(cat.definitions.definition_of_ready)}\n\n`;
  out += `## Definition of Done\n\nSe comprueba con \`ai-dev task complete\`.\n\n${list(cat.definitions.definition_of_done)}\n\n`;
  out += "## Tipos de tarea\n\n| Tipo | Significado |\n|---|---|\n";
  out += Object.entries(cat.definitions.task_kinds).map(([k, d]) => `| \`${k}\` | ${escape(d)} |`).join("\n");
  return `${out}\n`;
}

const escape = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
