# Estándar Documental y de Metadatos

Todo documento es **contenido (Markdown) + metadatos (frontmatter YAML)**.

## Estados
DRAFT · IN_REVIEW · APPROVED · OBSOLETE — transiciones en `catalog/states.yaml#document_status`.

## Tipos, identificadores y carpetas
Definidos en `catalog/document-types.yaml`. Los IDs siguen el patrón `<PREFIX>-<NNN>` (p. ej. `PRD-001`, `ADR-003`, `TASK-001A`). Los requisitos usan `FR-NNN` y `NFR-NNN`.

## Estructura canónica del proyecto
`docs/00-intake`, `01-product`, `02-ux`, `03-architecture`, `04-data`, `05-ai`, `06-execution`, `07-quality`, `08-decisions`, `09-release`, `10-operations`.

## Metadatos mínimos
```yaml
document_id: PRD-001
document_type: PRD
title: ...
version: 1.0.0
status: DRAFT
project: <project_id>
methodology_version: 1.2.0
created_at: 2026-10-08
updated_at: 2026-10-08
author: <persona o agente>
approved_by: null          # siempre una persona
source_of_truth: true
relations: []              # ver estándar de trazabilidad
provenance:                # obligatorio si intervino IA
  generated_by: <agente/herramienta>
  model: <modelo>
  model_version: <versión>
  context_ref: <referencia al contexto usado>
```

## Reglas
- Los documentos generados por IA nunca nacen APPROVED.
- `approved_by` identifica siempre a una persona con rol aprobador (`catalog/roles.yaml`).
- Un documento APPROVED que se modifica vuelve a IN_REVIEW e incrementa su versión.
