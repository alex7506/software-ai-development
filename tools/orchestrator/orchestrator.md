# Orchestrator

> Especificación. Ciclo canónico de ejecución: `methodology/catalog/lifecycle.yaml`.

REQUEST → IDENTIFY → LOAD_STATE → LOCATE_TASK → RESOLVE_CONTEXT → ANALYZE → PLAN → SELECT_EXECUTOR → AUTHORIZE → EXECUTE → TEST → REVIEW → VALIDATE → DOCUMENT → TRACE → COMMIT → UPDATE_STATE → NEXT_ACTION

El protocolo operativo IA y el contrato de agente son vistas de este ciclo.

Executors: LLM, AGENT, CLI, SCRIPT, API, IDE, HUMAN, DETERMINISTIC_TOOL.

Sin contexto no se ejecuta. Sin autorización no se ejecuta. Sin validación no se completa. Sin trazabilidad no se libera.
