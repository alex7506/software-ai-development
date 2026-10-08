<!-- Generado por `npm run docs:gen` desde la CLI y methodology/catalog. No editar a mano. -->

# Definition of Ready y Definition of Done

Fuente: `methodology/catalog/definitions.yaml`.

## Definition of Ready

Se comprueba con `ai-dev task ready`.

| Criterio | Automático | Descripción |
|---|---|---|
| `objective_defined` | Sí | La tarea tiene objetivo. |
| `acceptance_criteria` | Sí | Tiene al menos un criterio de aceptación verificable. |
| `traced_to_requirement` | Sí | Tiene una relación IMPLEMENTS hacia un FR/NFR |
| `dependencies_resolved` | Sí | Toda tarea en blocked_by está COMPLETED. |
| `executor_assigned` | Sí | Tiene executor (ver lifecycle.yaml#executors). |
| `risk_assessed` | Sí | Declara risk (ver risk.yaml) y capabilities requeridas. |
| `data_classified` | Sí | Declara la clasificación de datos máxima que maneja. |
| `context_identified` | No | Las fuentes de contexto necesarias están identificadas. |

## Definition of Done

Se comprueba con `ai-dev task complete`.

| Criterio | Automático | Descripción |
|---|---|---|
| `acceptance_met` | No | Cada criterio de aceptación está cumplido. |
| `evidence_attached` | Sí | Existe al menos una evidencia por criterio de aceptación. |
| `gates_passed` | Sí | Los gates de DEVELOPMENT exigidos por el modo están en PASS. |
| `tests_not_weakened` | No | Ninguna prueba se deshabilitó |
| `commits_traced` | Sí | Los commits de la tarea incluyen el trailer `Task: <ID>`. |
| `docs_updated` | No | Documentos afectados actualizados y AI-CONTEXT.md vigente. |
| `provenance_recorded` | Sí | Si intervino IA |
| `reviewed` | Sí | En modos con separation_of_duties |

## Tipos de tarea

| Tipo | Significado |
|---|---|
| `FEATURE` | Implementa uno o más requisitos FR/NFR. |
| `TECHNICAL` | Trabajo técnico necesario que no implementa un requisito directamente (infraestructura, configuración). |
| `CHORE` | Mantenimiento menor (dependencias, formato, limpieza). |
| `FIX` | Corrige un defecto; referencia la tarea, requisito o incidente afectado. |
