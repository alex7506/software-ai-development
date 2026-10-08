<!-- Generado por `npm run docs:gen` desde la CLI y methodology/catalog. No editar a mano. -->

# Comandos de `ai-dev`

CLI determinista de Software AI Development: instala, valida, traza y gobierna proyectos desarrollados con IA.

| Comando | Descripción |
|---|---|
| [`init`](init.md) | Instala la metodología en el directorio actual (proyecto nuevo o existente). No sobrescribe archivos. |
| [`new`](new.md) | Crea un documento desde su plantilla con el siguiente ID libre (p. ej. `ai-dev new PRD --title "..."`). |
| [`submit`](submit.md) | Envía un documento a revisión para que una persona lo apruebe. |
| [`revise`](revise.md) | Reabre un documento aprobado para modificarlo: vuelve a revisión y sube su versión. |
| [`approve`](approve.md) | Registra una decisión humana sobre una fase o un documento. Requiere terminal interactiva: los agentes no aprueban. |
| [`review`](review.md) | Sesión interactiva de aprobación: decide sobre documentos en revisión, requisitos y la fase actual, y avanza mientras todo esté listo. Solo personas. |
| [`validate`](validate.md) | Valida .ai-dev/, requisitos y documentos contra los esquemas y las reglas de la metodología. |
| [`trace`](trace.md) | Calcula la trazabilidad (requisitos → tareas → commits) y el estado de integridad. |
| [`status`](status.md) | Muestra fase, estado, tareas y aprobaciones pendientes. |
| [`context`](context.md) | Genera el contexto mínimo suficiente de una tarea para entregárselo a cualquier agente. |
| [`doctor`](doctor.md) | Diagnostica la instalación: Node, Git, versión fijada frente a la CLI y validez de .ai-dev/. |
| [`mode`](mode.md) | Cambia el modo de rigor mientras el proyecto no tenga ninguna aprobación; después requiere una solicitud de cambio. |
| [`adapters`](adapters.md) | Genera y comprueba los archivos de instrucciones de cada asistente de IA. |
| [`phase`](phase.md) | Comprueba, avanza o reingresa fases del ciclo. |
| [`task`](task.md) | Crea tareas y gestiona su ciclo de vida. |

Opciones globales: `-v, --version`, `-h, --help` (también en cada comando).
