# Claude Code

## Archivos
- **`CLAUDE.md`**: importa `AGENTS.md` con `@AGENTS.md`, así Claude Code carga las reglas al iniciar cada sesión.
- **`.claude/settings.json`**: reglas de permisos que Claude Code **aplica**, no solo sugiere.

## Permisos que se añaden
| Tipo | Reglas | Efecto |
|---|---|---|
| `deny` | `Bash(ai-dev approve *)` | Claude no puede aprobar |
| `deny` | `Edit(/.ai-dev/approvals.yaml)`, `Edit(/.ai-dev/state.yaml)` | No puede alterar aprobaciones ni estado a mano |
| `deny` | `Read(.env)`, `Read(.env.*)` (excepto `.env.example`) | No lee secretos |
| `deny` | `Bash(git push --force *)` | Sin push forzado |
| `ask` | `Bash(git push *)`, instalación de dependencias, `ai-dev revise` | Te pregunta antes |

Si ya tenías un `.claude/settings.json`, `sync` **añade** estas reglas sin quitar las tuyas ni otras claves.

Estas reglas forman parte de la metodología: si borras una, el siguiente `sync` la vuelve a añadir, y una regla `deny` no se puede anular desde `.claude/settings.local.json` (en Claude Code una denegación en cualquier archivo de configuración prevalece). Cambiarlas es un cambio de la metodología, no de un proyecto.

## Limitación
Las reglas de lectura y edición cubren las herramientas de archivos de Claude y los comandos de shell que Claude Code reconoce (`cat`, `sed`, redirecciones…), pero no un script que abra archivos por su cuenta. Para un aislamiento completo, activa el sandbox de Claude Code.

## Uso
```text
> Trabaja en TASK-012
```
Claude ejecutará `ai-dev status` y `ai-dev context TASK-012`, implementará, registrará evidencia y dejará la tarea en VALIDATING para que la revises.
