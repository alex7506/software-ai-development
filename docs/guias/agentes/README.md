# Trabajar con asistentes de IA

`ai-dev init` genera las instrucciones para cada asistente a partir de una sola fuente: las reglas de la metodología y la configuración de tu proyecto (`.ai-dev/`).

| Asistente | Archivos | Guía |
|---|---|---|
| Claude Code | `CLAUDE.md`, `.claude/settings.json` | [Claude Code](claude-code.md) |
| Cursor | `.cursor/rules/ai-dev.mdc` | [Cursor](cursor.md) |
| GitHub Copilot | `.github/copilot-instructions.md` | [Copilot](copilot.md) |
| Gemini CLI | `GEMINI.md` | [Gemini CLI](gemini.md) |
| Codex, Jules, Aider, Zed y otros | `AGENTS.md` | [Otros asistentes](otros.md) |

`AGENTS.md` se genera siempre: es la base que los demás importan o replican.

## Elegir qué asistentes usar
En `.ai-dev/configuration.yaml`:

```yaml
adapters: [agents-md, claude-code, cursor]
```

y después `ai-dev adapters sync`. También al iniciar: `ai-dev init --name "..." --adapters claude-code,cursor`.

## Mantenerlos al día
Los archivos se regeneran con `ai-dev adapters sync` cuando cambias proveedores, agentes o políticas locales, o cuando actualizas la metodología. `ai-dev validate` y `ai-dev doctor` avisan si alguno está desactualizado.

```bash
ai-dev adapters status   # UP_TO_DATE, OUTDATED, MODIFIED, MISSING…
ai-dev adapters sync
```

## Añadir instrucciones propias
El contenido generado va entre `<!-- ai-dev:begin … -->` y `<!-- ai-dev:end -->`. **Escribe tus instrucciones fuera de ese bloque**: `sync` nunca las toca. Si alguien edita dentro del bloque, `sync` no lo sobrescribe y lo marca como `MODIFIED`; mueve el cambio fuera del bloque o usa `ai-dev adapters sync --force` para descartarlo.

## Qué está garantizado y qué no
| Protección | Cómo se aplica | Alcance |
|---|---|---|
| Nadie aprueba sin estar en una terminal | `ai-dev approve` y `ai-dev review` exigen terminal interactiva y confirmar el nombre | Todos los asistentes |
| Detectar requisitos aprobados a mano o modificados | Huella de los requisitos aprobados, revisada por `ai-dev validate` | Todos |
| Detectar documentos editados tras aprobarse | Huella del contenido en `approvals.yaml`, revisada por `ai-dev validate` | Todos |
| Detectar aprobaciones escritas a mano | `ai-dev validate` exige el registro correspondiente | Todos |
| Bloquear `ai-dev approve` y `ai-dev review`, la edición de `approvals.yaml`/`state.yaml` y la lectura de `.env` | Reglas de permisos | **Solo Claude Code** |
| Seguir el flujo de trabajo, no ampliar alcance, no inventar | Instrucciones del adaptador | Depende de que el asistente las siga |

Las instrucciones guían, pero no obligan. Lo que de verdad protege el proyecto son las comprobaciones de la CLI y la revisión humana: ejecuta `ai-dev validate` y `ai-dev trace` en la CI.
