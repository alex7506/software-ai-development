# Project Bootstrapper

> Especificación. Implementación prevista: `ai-dev init` (`cli/`).

Gestiona intake, documentos progresivos, validación, estructura física, configuración `.ai-dev`, detección de proyectos existentes e idempotencia.

Recorre las fases INTAKE → … → BOOTSTRAPPING del ciclo canónico (`methodology/catalog/phases.yaml`). Cada fase cierra con su gate y aprobación; no existe una fase VALIDATION previa a BOOTSTRAPPING.

Al superar el gate de BOOTSTRAPPING el proyecto queda **READY_FOR_DEVELOPMENT** (fase DEVELOPMENT, estado ACTIVE).
