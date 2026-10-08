import type { Catalog } from "./catalog.js";
import { isGitRepo } from "./git.js";
import { error, info, warning, type Issue } from "./issues.js";
import { findProjectRoot, Project } from "./project.js";
import type { SchemaRegistry } from "./schema.js";
import { validateProject } from "./validate.js";

export function runDoctor(cwd: string, cat: Catalog, registry: SchemaRegistry, cliVersion: string): Issue[] {
  const issues: Issue[] = [];
  const major = Number(process.versions.node.split(".")[0]);
  issues.push(major >= 20 ? info("node", `Node ${process.versions.node}.`) : error("node", `Node ${process.versions.node}: se requiere 20 o superior.`));
  issues.push(info("cli", `CLI y metodología ${cliVersion} (${cat.root}).`));

  const root = findProjectRoot(cwd);
  if (!root) {
    issues.push(warning("no_project", "No hay un proyecto ai-dev aquí. Usa `ai-dev init --name \"...\"`."));
    return issues;
  }
  issues.push(info("project", `Proyecto en ${root}.`));
  issues.push(isGitRepo(root) ? info("git", "Repositorio Git presente.") : warning("git", "El proyecto no usa Git: la trazabilidad de commits no está disponible."));

  const p = Project.at(root, cat);
  if (p.hasAiDev("methodology")) {
    const pinned = p.methodology.methodology.version;
    if (pinned === cliVersion) issues.push(info("version", `Versión fijada ${pinned}, igual a la de la CLI.`));
    else {
      const newer = compareVersions(pinned, cliVersion) > 0;
      issues.push(
        warning(
          "version",
          newer
            ? `El proyecto fija ${pinned}, más nueva que la CLI (${cliVersion}): actualiza la CLI.`
            : `El proyecto fija ${pinned} y la CLI es ${cliVersion}. Actualizar la versión fijada requiere un CHANGE_REQUEST (ver methodology/09-project-setup).`,
        ),
      );
    }
  }
  const errors = validateProject(p, registry, cliVersion).filter((i) => i.level === "ERROR");
  issues.push(errors.length ? error("validate", `\`ai-dev validate\` encuentra ${errors.length} errores.`) : info("validate", "`ai-dev validate` sin errores."));
  return issues;
}

export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff) return Math.sign(diff);
  }
  return 0;
}
