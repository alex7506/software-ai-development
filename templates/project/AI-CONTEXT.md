# AI-CONTEXT — {{project_name}}

<!-- Resumen vivo para agentes. Máximo catalog/limits.yaml#max_ai_context_md_lines líneas.
     No duplica documentos: los referencia. Se actualiza al cerrar tareas que cambien su contenido. -->

## Propósito
<!-- Una o dos frases. -->

## Estado
- Fase y estado: ver `.ai-dev/state.yaml`
- Modo de rigor: {{mode}}

## Stack aprobado
<!-- Tecnologías aprobadas, con referencia al ADR o TECH_DESIGN. Vacío hasta la fase TECHNOLOGY. -->

## Alcance
<!-- Resumen; detalle en docs/01-product/. -->

## Fuera de alcance
- 

## Fuentes de verdad
| Tema | Documento |
|---|---|
| Requisitos | `docs/01-product/requirements.yaml` |
| Arquitectura | `docs/03-architecture/` |
| Decisiones | `docs/08-decisions/adr/` |
| Tareas | `docs/06-execution/tasks/` |

## Reglas
- No añadir funcionalidad ni tecnología sin requisito o cambio aprobado.
- Antes de trabajar en una tarea: `ai-dev context <TASK-ID>`.
- Antes de cerrarla: `ai-dev validate` y `ai-dev trace`.
- Nunca ejecutar `ai-dev approve`: la aprobación es humana.
