# Task Engine

> Especificación. Implementación prevista: `ai-dev task` (`cli/`).

Una tarea debe tener objetivo, contexto, restricciones, permisos, criterios de aceptación, executor, estado, evidencia y relaciones de trazabilidad.

Estados y transiciones válidas: `methodology/catalog/states.yaml#task_status`. Un bloqueo por dependencia se expresa con `status: BLOCKED` y `blocked_by: [IDs]`.

Límite de correcciones automáticas: `methodology/catalog/limits.yaml#max_auto_fix_attempts`.
