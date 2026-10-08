# Estándar de Trabajo: tareas, evidencia y aprobaciones

## Tareas
Toda unidad de trabajo es una tarea (`TASK-NNN`) en `docs/06-execution/tasks/`. Campos obligatorios: objetivo, tipo (`kind`), contexto, restricciones, capacidades requeridas, riesgo, clasificación de datos, criterios de aceptación, executor, estado, evidencia y relaciones (`schemas/task.schema.yaml`).

Tipos: FEATURE, TECHNICAL, CHORE, FIX (`catalog/definitions.yaml#task_kinds`). Una tarea FEATURE implementa al menos un requisito; las demás justifican su existencia.

Una tarea debe poder completarse en una sesión de trabajo. Si no, se divide.

## Definition of Ready y Definition of Done
Una tarea pasa a READY solo si cumple la **Definition of Ready**, y a COMPLETED solo si cumple la **Definition of Done**. Ambas listas, con sus criterios automatizables, están en `catalog/definitions.yaml`.

## Evidencia
Una afirmación sin evidencia no cuenta. Cada evidencia se registra en la tarea:

```yaml
evidence:
  - criterion: AC-1
    type: TEST_RUN          # TEST_RUN | REPORT | COMMIT | SCREENSHOT | LOG | REVIEW | MANUAL_CHECK
    ref: "npm test — 42 passed, 0 failed"
    recorded_at: 2026-10-08
```

La evidencia referencia artefactos verificables (salida de comandos, commits, informes); nunca contiene secretos ni datos RESTRICTED.

## Commits y ramas
- Cada commit vinculado a una tarea incluye el trailer `Task: TASK-NNN`.
- Si intervino IA en el commit, incluye además un trailer de coautoría o `AI-Assisted: <agente/modelo>`.
- Una rama por tarea o por grupo coherente de tareas; nunca trabajo directo en la rama principal en modos STANDARD y CRITICAL.

## Aprobaciones
- La aprobación es **exclusivamente humana** (`no_self_approval`). Un agente puede preparar, revisar y recomendar; nunca aprobar.
- Se registra en `.ai-dev/approvals.yaml` (`schemas/approvals.schema.yaml`) con objetivo, decisión (APPROVED / REJECTED / CHANGES_REQUESTED), persona, rol, fecha y comentario.
- En modos con `separation_of_duties`, quien produjo o ejecutó un entregable no lo aprueba.
- En modo CRITICAL, las fases de `dual_approval_phases` requieren dos aprobaciones de personas distintas, una de ellas del SECURITY_OFFICER cuando el cambio afecte a seguridad o datos.
- Aprobar un entregable fija su versión y una huella de su contenido: cualquier cambio posterior invalida la aprobación y obliga a revisarlo de nuevo (`ai-dev revise`).
- Los requisitos se aprueban como conjunto (`ai-dev approve REQUIREMENTS`, rol PRODUCT_OWNER); la huella cubre el contenido de los requisitos aprobados, no su estado.
- Quien asume varios roles puede revisar todo lo pendiente en una sesión interactiva (`ai-dev review`); cada decisión se registra por separado y sigue siendo explícita.

## Reintentos
Un ciclo automático de corrección es: ejecutar → fallar → corregir. Al alcanzar `catalog/limits.yaml#max_auto_fix_attempts` la tarea pasa a REQUIRES_REVIEW con el registro de los intentos.
