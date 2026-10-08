# Gestionar tareas

## Crear una tarea
Una tarea de tipo FEATURE implementa al menos un requisito aprobado:

```bash
ai-dev task new --title "Registro de usuarios" \
  --implements FR-001 \
  --criterion "Un usuario nuevo se registra con email y contraseña" \
  --criterion "Un email repetido muestra un error" \
  --risk MEDIUM --data CONFIDENTIAL
```

Las tareas técnicas, de mantenimiento o correcciones no implementan un requisito, pero necesitan justificación:

```bash
ai-dev task new --title "Configurar CI" --kind TECHNICAL \
  --justification "Ejecutar pruebas en cada PR" --criterion "La CI pasa en main"
```

Las dependencias se declaran con `--depends-on TASK-NNN`.

## El ciclo
```
PENDING → READY → IN_PROGRESS → VALIDATING → COMPLETED
```

| Comando | Qué hace |
|---|---|
| `ai-dev task ready TASK-001` | Comprueba la **Definition of Ready**: criterios definidos, requisito aprobado, dependencias cerradas. |
| `ai-dev task start TASK-001` | La empieza y la fija como tarea actual. |
| `ai-dev context TASK-001` | Genera el contexto mínimo para entregárselo al agente de IA. |
| `ai-dev task evidence TASK-001 --criterion AC-1 --type TEST_RUN --ref "npm test — 12 passed"` | Registra la evidencia de un criterio. |
| `ai-dev task provenance TASK-001 --generated-by claude-code --model <modelo>` | Registra qué IA la ejecutó (obligatorio si el ejecutor es AGENT o LLM). |
| `ai-dev task validate TASK-001` | La pasa a validación. |
| `ai-dev task complete TASK-001 --reviewed-by "Luis Gómez"` | Comprueba la **Definition of Done**, ejecuta los gates configurados y la cierra. |

Otros movimientos: `block` (con `--by TASK-NNN` o `--reason`), `review`, `wait`, `cancel` y `fail` (estos dos, con `--reason`). Una transición no permitida se rechaza indicando las válidas.

## Qué exige el cierre
- Evidencia para **cada** criterio de aceptación.
- Los gates de `gate_commands` (por ejemplo `npm test`) en verde. Los gates sin comando se avisan para verificación manual.
- En STANDARD y CRITICAL, la revisión de alguien distinto a quien la ejecutó (`--reviewed-by`).
- Al menos un commit con el trailer `Task: TASK-001`.

## Correcciones automáticas
Cada vez que un agente reintenta una corrección:

```bash
ai-dev task attempt TASK-001 --note "falla la validación de email"
```

Al llegar al límite (3 por defecto) la tarea pasa a **REQUIRES_REVIEW**: una persona debe revisar antes de seguir.

## Commits
```
Añade validación de email

Task: TASK-001
```

`ai-dev trace --git` comprueba que los commits referencian tareas existentes.

Referencia completa: [`ai-dev task`](../referencia/cli/task.md).
