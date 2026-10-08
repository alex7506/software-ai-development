import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Command, CommanderError, Option } from "commander";
import { adapterStatus, syncAdapters } from "./core/adapters.js";
import { recordApproval } from "./core/approvals.js";
import { DEFAULT_ROOT, loadCatalog, methodologyVersion, type Catalog } from "./core/catalog.js";
import { buildContext } from "./core/context.js";
import { createDocument, reviseDocument, submitDocument } from "./core/documents.js";
import { runDoctor } from "./core/doctor.js";
import { gitUserName } from "./core/git.js";
import { resolveDocumentType } from "./core/ids.js";
import { CliError, hasErrors } from "./core/issues.js";
import { formatIssues, summary, table } from "./core/output.js";
import { advancePhase, checkPhase, reenterPhase } from "./core/phases.js";
import { Project } from "./core/project.js";
import { initProject } from "./core/scaffold.js";
import { SchemaRegistry } from "./core/schema.js";
import { addEvidence, moveTask, recordAttempt } from "./core/tasks.js";
import { traceProject } from "./core/trace.js";
import { validateProject } from "./core/validate.js";

export interface Env {
  cwd: string;
  now: () => Date;
  out: (text: string) => void;
  err: (text: string) => void;
  /** true solo con una persona frente a una terminal (stdin y stdout TTY). */
  interactive: boolean;
  ask: (question: string) => Promise<string>;
}

const collect = (value: string, previous: string[] = []) => [...previous, value];

export function buildProgram(env: Env): { program: Command; exitCode: () => number } {
  let code = 0;
  let cat: Catalog | undefined;
  let registry: SchemaRegistry | undefined;
  const catalog = () => (cat ??= loadCatalog());
  const schemas = () => (registry ??= new SchemaRegistry(catalog()));
  const version = methodologyVersion(DEFAULT_ROOT);
  const project = () => Project.load(env.cwd, catalog());
  const author = (explicit?: string) => explicit ?? gitUserName(env.cwd) ?? process.env.USER ?? "UNKNOWN";
  const json = (data: unknown) => env.out(JSON.stringify(data, null, 2));

  const program = new Command("ai-dev")
    .description("CLI determinista de Software AI Development: instala, valida, traza y gobierna proyectos desarrollados con IA.")
    .version(version, "-v, --version", "Muestra la versión de la metodología y la CLI.")
    .helpOption("-h, --help", "Muestra la ayuda.")
    .addHelpCommand(false)
    .configureOutput({ writeOut: (s) => env.out(s.trimEnd()), writeErr: (s) => env.err(s.trimEnd()) })
    .exitOverride();

  program
    .command("init")
    .description("Instala la metodología en el directorio actual (proyecto nuevo o existente). No sobrescribe archivos.")
    .argument("[dir]", "Directorio del proyecto", ".")
    .requiredOption("--name <nombre>", "Nombre del proyecto")
    .option("--id <id>", "Identificador en minúsculas con guiones (por defecto, derivado del nombre)")
    .addOption(new Option("--mode <modo>", "Modo de rigor").choices(["LITE", "STANDARD", "CRITICAL"]).default("STANDARD"))
    .option("--profile <perfil>", "Perfil tecnológico (p. ej. google)")
    .option("--author <nombre>", "Autor de los documentos iniciales (por defecto, git user.name)")
    .option("--phase <fase>", "Fase inicial al adoptar un proyecto existente")
    .option("--adapters <lista>", "Adaptadores separados por comas: agents-md, claude-code, cursor, copilot, gemini (por defecto, todos)", (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean))
    .action((dir: string, o) => {
      const root = resolve(env.cwd, dir);
      const r = initProject(catalog(), root, { name: o.name, id: o.id, mode: o.mode, profile: o.profile, author: author(o.author), phase: o.phase, adapters: o.adapters, methodologyVersion: version, now: env.now() });
      env.out(`${r.adopted ? "Proyecto existente adoptado" : "Proyecto inicializado"} en ${root} (metodología ${version}, modo ${o.mode}).`);
      if (r.created.length) env.out(`\nCreados:\n${r.created.map((f) => `  + ${f}`).join("\n")}`);
      if (r.kept.length) env.out(`\nYa existían (sin cambios):\n${r.kept.map((f) => `  = ${f}`).join("\n")}`);
      env.out(`\nSiguientes pasos:\n  1. Completa .ai-dev/configuration.yaml (características, proveedores y agentes).\n  2. ${r.adopted ? "Documenta el estado actual del proyecto (ver guía de adopción)." : "Completa el documento de intake en docs/00-intake/."}\n  3. Ejecuta \`ai-dev validate\` y \`ai-dev status\`.`);
    });

  program
    .command("new")
    .description("Crea un documento desde su plantilla con el siguiente ID libre (p. ej. `ai-dev new PRD --title \"...\"`).")
    .argument("<tipo>", "Tipo de documento o su prefijo: PRD, ADR, ARCHITECTURE, TD…")
    .requiredOption("--title <título>", "Título del documento")
    .option("--author <nombre>", "Autor (por defecto, git user.name)")
    .action((type: string, o) => {
      const p = project();
      const t = resolveDocumentType(type, p.cat.documentTypes.types);
      if (t === "TASK") throw new CliError("Para tareas usa `ai-dev task new`.");
      const doc = createDocument(p, t, { title: o.title, author: author(o.author), now: env.now() });
      env.out(`Creado ${doc.id}: ${doc.rel}`);
    });

  program
    .command("submit")
    .description("Envía un documento a revisión para que una persona lo apruebe.")
    .argument("<id>", "ID del documento")
    .action((id: string) => {
      const doc = submitDocument(project(), schemas(), id, env.now());
      env.out(`${doc.id} pasa a ${String(doc.data.status)}. Un responsable debe ejecutar \`ai-dev approve ${doc.id}\`.`);
    });

  program
    .command("revise")
    .description("Reabre un documento aprobado para modificarlo: vuelve a revisión y sube su versión.")
    .argument("<id>", "ID del documento")
    .action((id: string) => {
      const doc = reviseDocument(project(), schemas(), id, env.now());
      env.out(`${doc.id} reabierto en versión ${String(doc.data.version)} (${String(doc.data.status)}).`);
    });

  program
    .command("approve")
    .description("Registra una decisión humana sobre una fase o un documento. Requiere terminal interactiva: los agentes no aprueban.")
    .argument("<objetivo>", "Fase (p. ej. DEFINITION) o ID de documento")
    .requiredOption("--by <nombre>", "Persona que decide")
    .requiredOption("--role <rol>", "Rol aprobador: PRODUCT_OWNER, TECH_LEAD, QA_LEAD, SECURITY_OFFICER, OPERATOR")
    .option("--reject", "Rechaza en lugar de aprobar")
    .option("--request-changes", "Pide cambios en lugar de aprobar")
    .option("--comment <texto>", "Comentario de la decisión")
    .action(async (target: string, o) => {
      if (!env.interactive) {
        throw new CliError("`ai-dev approve` requiere una terminal interactiva con una persona presente. Los agentes de IA no pueden aprobar (política no_self_approval).");
      }
      const decision = o.reject ? "REJECTED" : o.requestChanges ? "CHANGES_REQUESTED" : "APPROVED";
      const answer = await env.ask(`Vas a registrar ${decision} sobre ${target} como ${o.by} (${o.role}). Escribe tu nombre para confirmar: `);
      if (answer.trim() !== o.by.trim()) throw new CliError("La confirmación no coincide con --by. No se registró nada.");
      const a = recordApproval(project(), schemas(), version, { target, by: o.by, role: o.role, decision, comment: o.comment }, env.now());
      env.out(`Registrado ${a.id}: ${a.decision} de ${a.target} por ${a.by} (${a.role}).`);
    });

  program
    .command("validate")
    .description("Valida .ai-dev/, requisitos y documentos contra los esquemas y las reglas de la metodología.")
    .option("--json", "Salida en JSON")
    .action((o) => {
      const issues = validateProject(project(), schemas(), version);
      if (o.json) json({ valid: !hasErrors(issues), issues });
      else env.out(`${formatIssues(issues)}\n\n${summary(issues)}`);
      if (hasErrors(issues)) code = 1;
    });

  program
    .command("trace")
    .description("Calcula la trazabilidad (requisitos → tareas → commits) y el estado de integridad.")
    .option("--git", "Incluye los commits y sus trailers `Task: TASK-NNN`")
    .option("--json", "Salida en JSON")
    .action((o) => {
      const r = traceProject(project(), { git: o.git });
      if (o.json) json(r);
      else {
        const s = r.stats;
        env.out(`Integridad: ${r.status} (mínimo del modo: ${r.minimum})`);
        env.out(`${s.requirements} requisitos, ${s.tasks} tareas, ${s.edges} relaciones${s.commits !== undefined ? `, ${s.commits} commits` : ""}.`);
        if (r.issues.length) env.out(`\n${formatIssues(r.issues)}`);
      }
      if (!r.meetsMinimum) code = 1;
    });

  program
    .command("status")
    .description("Muestra fase, estado, tareas y aprobaciones pendientes.")
    .option("--json", "Salida en JSON")
    .action((o) => {
      const p = project();
      const m = p.methodology;
      const state = p.state;
      const tasks = p.tasks();
      const counts: Record<string, number> = {};
      for (const t of tasks) counts[String(t.data.status)] = (counts[String(t.data.status)] ?? 0) + 1;
      const check = checkPhase(p, schemas(), version);
      const pending = check.items.filter((i) => !i.ok);
      if (o.json) return json({ project: m.project, mode: m.mode, methodology: m.methodology.version, state, tasks: counts, phase_check: check });
      env.out(`${m.project.name} (${m.project.id}) · modo ${m.mode} · metodología ${m.methodology.version}`);
      env.out(`Fase: ${state.phase} · Estado: ${state.status}${state.current_task ? ` · Tarea actual: ${state.current_task}` : ""}`);
      env.out(`Tareas: ${tasks.length ? Object.entries(counts).map(([s, n]) => `${s} ${n}`).join(", ") : "ninguna"}`);
      env.out(pending.length ? `\nPara cerrar ${state.phase} falta:\n${pending.map((i) => `  - ${i.kind} ${i.name}: ${i.detail}`).join("\n")}` : `\n${state.phase} lista y aprobada: \`ai-dev phase advance\`.`);
    });

  program
    .command("context")
    .description("Genera el contexto mínimo suficiente de una tarea para entregárselo a cualquier agente.")
    .argument("<task-id>", "ID de la tarea")
    .option("--out <archivo>", "Escribe el contexto en un archivo en lugar de la salida estándar")
    .action((id: string, o) => {
      const text = buildContext(project(), id);
      if (o.out) {
        writeFileSync(resolve(env.cwd, o.out), text);
        env.out(`Contexto de ${id} escrito en ${o.out}.`);
      } else env.out(text);
    });

  program
    .command("doctor")
    .description("Diagnostica la instalación: Node, Git, versión fijada frente a la CLI y validez de .ai-dev/.")
    .action(() => {
      const issues = runDoctor(env.cwd, catalog(), schemas(), version);
      env.out(formatIssues(issues));
      if (hasErrors(issues)) code = 1;
    });

  const adapters = program.command("adapters").description("Genera y comprueba los archivos de instrucciones de cada asistente de IA.");
  adapters
    .command("sync")
    .description("Genera o actualiza AGENTS.md, CLAUDE.md, GEMINI.md, reglas de Cursor e instrucciones de Copilot desde la metodología y .ai-dev/.")
    .option("--force", "Sobrescribe también los bloques generados que se editaron a mano")
    .action((o) => {
      const results = syncAdapters(project(), { force: o.force });
      env.out(table([["ADAPTADOR", "ARCHIVO", "ACCIÓN"], ...results.map((r) => [r.adapter, r.target, r.action])]));
      const skipped = results.filter((r) => r.action.startsWith("SKIPPED"));
      if (skipped.length) {
        env.out(`\n${skipped.map((r) => r.status === "MODIFIED" ? `▲ ${r.target}: el bloque generado se editó a mano. Mueve tus cambios fuera del bloque o usa --force.` : `✖ ${r.target}: JSON inválido; corrígelo y vuelve a ejecutar.`).join("\n")}`);
        code = 1;
      }
    });
  adapters
    .command("status")
    .description("Muestra si cada archivo de adaptador existe y está al día.")
    .option("--json", "Salida en JSON")
    .action((o) => {
      const states = adapterStatus(project());
      if (o.json) return json(states);
      env.out(table([["ADAPTADOR", "ARCHIVO", "ESTADO"], ...states.map((s) => [s.adapter, s.target, s.status])]));
      if (states.some((s) => s.status !== "UP_TO_DATE")) code = 1;
    });

  // --- Fases -------------------------------------------------------------------
  const phase = program.command("phase").description("Comprueba, avanza o reingresa fases del ciclo.");
  phase
    .command("check")
    .description("Evalúa entregables, checks, gates y aprobación de una fase (por defecto, la actual).")
    .argument("[fase]", "Fase a evaluar")
    .option("--json", "Salida en JSON")
    .action((name: string | undefined, o) => {
      const c = checkPhase(project(), schemas(), version, name?.toUpperCase());
      if (o.json) return json(c);
      env.out(`Fase ${c.phase}: ${c.ready ? (c.approved ? "lista y aprobada" : "lista, pendiente de aprobación") : "incompleta"}\n`);
      env.out(table([["", "TIPO", "NOMBRE", "DETALLE"], ...c.items.map((i) => [i.ok ? "✔" : "✖", i.kind, i.name, i.detail])]));
      if (!c.ready || !c.approved) code = 1;
    });
  phase
    .command("advance")
    .description("Pasa a la siguiente fase si la actual está completa y aprobada.")
    .action(() => {
      const r = advancePhase(project(), schemas(), version, env.now());
      env.out(`Fase ${r.from} cerrada. Fase actual: ${r.to}.`);
    });
  phase
    .command("reenter")
    .description("Desde EVOLUTION, reingresa en la fase que indica una solicitud de cambio aprobada.")
    .requiredOption("--change <id>", "Solicitud de cambio aprobada (CHANGE-NNN)")
    .action((o) => {
      const r = reenterPhase(project(), o.change, env.now());
      env.out(`Reingreso por ${o.change}: ${r.from} → ${r.to}.`);
    });

  // --- Tareas ------------------------------------------------------------------
  const task = program.command("task").description("Crea tareas y gestiona su ciclo de vida.");
  task
    .command("new")
    .description("Crea una tarea. Una FEATURE implementa al menos un requisito; las demás requieren --justification.")
    .requiredOption("--title <título>", "Título de la tarea")
    .addOption(new Option("--kind <tipo>", "Tipo de tarea").choices(["FEATURE", "TECHNICAL", "CHORE", "FIX"]).default("FEATURE"))
    .option("--objective <texto>", "Objetivo (por defecto, el título)")
    .option("--implements <req>", "Requisito que implementa (repetible)", collect)
    .option("--criterion <texto>", "Criterio de aceptación (repetible)", collect)
    .option("--depends-on <task>", "Tarea de la que depende (repetible)", collect)
    .option("--justification <texto>", "Justificación (obligatoria si no es FEATURE)")
    .option("--risk <nivel>", "LOW, MEDIUM, HIGH, CRITICAL", "MEDIUM")
    .option("--data <nivel>", "Clasificación de datos: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED", "INTERNAL")
    .option("--capability <capacidad>", "Capacidad requerida (repetible)", collect)
    .option("--executor <ejecutor>", "LLM, AGENT, CLI, SCRIPT, API, IDE, HUMAN, DETERMINISTIC_TOOL", "AGENT")
    .option("--assignee <nombre>", "Responsable de ejecutarla")
    .option("--author <nombre>", "Autor (por defecto, git user.name)")
    .action((o) => {
      const p = project();
      const deps: string[] = o.dependsOn ?? [];
      const relations = [
        ...((o.implements as string[] | undefined) ?? []).map((target) => ({ type: "IMPLEMENTS", target })),
        ...deps.map((target) => ({ type: "DEPENDS_ON", target })),
      ];
      const criteria = ((o.criterion as string[] | undefined) ?? ["UNKNOWN"]).map((description, i) => ({ id: `AC-${i + 1}`, description }));
      const doc = createDocument(p, "TASK", {
        title: o.title,
        author: author(o.author),
        now: env.now(),
        fields: {
          kind: o.kind,
          objective: o.objective ?? o.title,
          risk: o.risk,
          data_classification: o.data,
          capabilities: o.capability ?? ["code_modification", "test_generation"],
          executor: o.executor,
          assignee: o.assignee ?? null,
          acceptance_criteria: criteria,
          blocked_by: deps,
          relations,
          justification: o.justification ?? (o.kind === "FEATURE" ? null : "UNKNOWN"),
        },
      });
      env.out(`Creada ${doc.id}: ${doc.rel}`);
      const issues = schemas().validate("task", doc.data).errors;
      if (issues.length) env.out(`Complétala antes de pasarla a READY:\n${issues.map((e) => `  - ${e}`).join("\n")}`);
    });

  task
    .command("list")
    .description("Lista las tareas.")
    .option("--status <estado>", "Filtra por estado")
    .action((o) => {
      const tasks = project().tasks().filter((t) => !o.status || t.data.status === o.status.toUpperCase());
      if (!tasks.length) return env.out("No hay tareas.");
      env.out(table([["ID", "ESTADO", "TIPO", "TÍTULO"], ...tasks.map((t) => [t.id, String(t.data.status), String(t.data.kind), String(t.data.title)])]));
    });

  const moves: [string, string, string][] = [
    ["ready", "READY", "Marca la tarea como lista (comprueba la Definition of Ready)."],
    ["start", "IN_PROGRESS", "Empieza o reanuda la tarea y la fija como tarea actual."],
    ["review", "REQUIRES_REVIEW", "Pide revisión humana de la tarea."],
    ["wait", "WAITING_APPROVAL", "Deja la tarea esperando una aprobación externa."],
    ["validate", "VALIDATING", "Pasa la tarea a validación."],
  ];
  for (const [name, to, description] of moves) {
    task.command(name).description(description).argument("<id>", "ID de la tarea").action((id: string) => {
      const issues = moveTask(project(), schemas(), id, to, { now: env.now() });
      env.out(`${id} → ${to}`);
      if (issues.length) env.out(formatIssues(issues.filter((i) => i.level !== "INFO")));
    });
  }
  task
    .command("complete")
    .description("Cierra la tarea (comprueba la Definition of Done y ejecuta los gates configurados).")
    .argument("<id>", "ID de la tarea")
    .option("--reviewed-by <nombre>", "Persona que revisó la tarea")
    .action((id: string, o) => {
      const issues = moveTask(project(), schemas(), id, "COMPLETED", { now: env.now(), reviewedBy: o.reviewedBy });
      env.out(`${id} → COMPLETED`);
      const warnings = issues.filter((i) => i.level === "WARNING");
      if (warnings.length) env.out(formatIssues(warnings));
    });
  task
    .command("block")
    .description("Bloquea la tarea por una dependencia o un motivo.")
    .argument("<id>", "ID de la tarea")
    .option("--by <task>", "Tarea que la bloquea (repetible)", collect)
    .option("--reason <texto>", "Motivo del bloqueo")
    .action((id: string, o) => {
      moveTask(project(), schemas(), id, "BLOCKED", { now: env.now(), blockedBy: o.by, reason: o.reason });
      env.out(`${id} → BLOCKED`);
    });
  for (const [name, to] of [["cancel", "CANCELLED"], ["fail", "FAILED"]] as const) {
    task
      .command(name)
      .description(`Pasa la tarea a ${to}.`)
      .argument("<id>", "ID de la tarea")
      .requiredOption("--reason <texto>", "Motivo")
      .action((id: string, o) => {
        moveTask(project(), schemas(), id, to, { now: env.now(), reason: o.reason });
        env.out(`${id} → ${to}`);
      });
  }
  task
    .command("evidence")
    .description("Registra evidencia de un criterio de aceptación.")
    .argument("<id>", "ID de la tarea")
    .requiredOption("--criterion <AC-n>", "Criterio de aceptación")
    .addOption(new Option("--type <tipo>", "Tipo de evidencia").choices(["TEST_RUN", "REPORT", "COMMIT", "SCREENSHOT", "LOG", "REVIEW", "MANUAL_CHECK"]).makeOptionMandatory())
    .requiredOption("--ref <referencia>", "Referencia verificable (salida de comando, commit, ruta del informe…)")
    .action((id: string, o) => {
      addEvidence(project(), schemas(), id, { criterion: o.criterion, type: o.type, ref: o.ref }, env.now());
      env.out(`Evidencia de ${o.criterion} registrada en ${id}.`);
    });
  task
    .command("attempt")
    .description("Registra un intento automático de corrección; al llegar al límite la tarea pasa a REQUIRES_REVIEW.")
    .argument("<id>", "ID de la tarea")
    .option("--note <texto>", "Qué falló")
    .action((id: string, o) => {
      const r = recordAttempt(project(), schemas(), id, env.now(), o.note);
      env.out(`${id}: intento ${r.attempts}/${r.limit}.${r.escalated ? " Límite alcanzado: la tarea pasa a REQUIRES_REVIEW." : ""}`);
    });
  task
    .command("provenance")
    .description("Registra qué agente o modelo de IA ejecutó la tarea.")
    .argument("<id>", "ID de la tarea")
    .requiredOption("--generated-by <agente>", "Agente o herramienta")
    .option("--model <modelo>", "Modelo")
    .option("--model-version <versión>", "Versión del modelo")
    .option("--context-ref <ref>", "Referencia al contexto usado")
    .action((id: string, o) => {
      const p = project();
      const t = p.document(id);
      t.data.provenance = Object.fromEntries(
        Object.entries({ generated_by: o.generatedBy, model: o.model, model_version: o.modelVersion, context_ref: o.contextRef }).filter(([, v]) => v),
      );
      const r = schemas().validate("task", t.data);
      if (!r.valid) throw new CliError(r.errors.join("\n"));
      p.saveDocument(t);
      env.out(`Procedencia registrada en ${id}.`);
    });

  return { program, exitCode: () => code };
}

/** Ejecuta la CLI con los argumentos dados (sin `node` ni el script) y devuelve el código de salida. */
export async function runCli(args: string[], env: Env): Promise<number> {
  const { program, exitCode } = buildProgram(env);
  try {
    await program.parseAsync(args, { from: "user" });
    return exitCode();
  } catch (e) {
    if (e instanceof CommanderError) return e.exitCode === 0 || e.code === "commander.helpDisplayed" || e.code === "commander.version" ? 0 : 1;
    if (e instanceof CliError) {
      env.err(`✖ ${e.message}`);
      return 1;
    }
    throw e;
  }
}
