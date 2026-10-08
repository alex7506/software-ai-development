# Desarrollador

Ejecutas tareas, con o sin asistentes de IA. Si trabajas con un agente, eres responsable de lo que entrega.

## El ciclo de una tarea
```
PENDING → READY → IN_PROGRESS → VALIDATING → COMPLETED
```
con desvíos posibles a BLOCKED, WAITING_APPROVAL, REQUIRES_REVIEW o FAILED.

1. **Antes de empezar**: la tarea debe cumplir la *Definition of Ready* (objetivo, criterios de aceptación, requisito que implementa, riesgo, datos, dependencias resueltas).
2. **Contexto**: reúne solo lo necesario (la tarea, sus requisitos, los ADR y archivos relacionados). Con la herramienta: `ai-dev context TASK-NNN`.
3. **Plan**: describe el enfoque en la tarea antes de tocar código.
4. **Implementación**: dentro del alcance de la tarea. Si descubres que hace falta algo más, se crea otra tarea o una solicitud de cambio; no se amplía la actual.
5. **Evidencia**: registra en la tarea la prueba de cada criterio de aceptación.
6. **Cierre**: la tarea cumple la *Definition of Done* y, en STANDARD y CRITICAL, la revisa alguien distinto a quien la ejecutó.

## Commits
Cada commit lleva la tarea al final del mensaje:
```
Task: TASK-012
```
Si intervino IA, indícalo también (por ejemplo con un trailer de coautoría).

## Trabajar con un agente de IA
- El agente lee sus reglas del adaptador del proyecto (AGENTS.md, CLAUDE.md…).
- Dale la tarea concreta, no "mejora el proyecto".
- Si el agente se atasca, a los 3 intentos automáticos la tarea pasa a REQUIRES_REVIEW: revisa tú antes de seguir.
- Nunca le pidas que apruebe nada ni que desactive pruebas o controles.

## Lo que no puedes hacer
Ampliar el alcance, añadir dependencias o cambiar tecnologías sin aprobación, incluir secretos en cualquier archivo, desactivar pruebas para que pasen o trabajar directamente en la rama principal (en STANDARD y CRITICAL).
