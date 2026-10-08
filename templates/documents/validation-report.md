---
document_id: "{{id}}"
document_type: VALIDATION_REPORT
title: "{{title}}"
version: 0.1.0
status: DRAFT
project: "{{project_id}}"
methodology_version: "{{methodology_version}}"
created_at: "{{date}}"
updated_at: "{{date}}"
author: "{{author}}"
approved_by: null
source_of_truth: true
outcome: REQUIRES_HUMAN_REVIEW
traceability_status: WARNINGS
checks:
  - target: "{{requirement_id}}"
    result: PASS
    evidence: []
relations: []
---

# {{id}} — {{title}}

<!-- Fase VALIDATION. Una fila de `checks` por requisito y por gate, cada una con evidencia. -->

## Alcance de la validación
<!-- Versión validada, entorno, fecha. -->

## Resultados por requisito
| Requisito | Resultado | Evidencia |
|---|---|---|
| FR-001 | PASS |  |

## Gates
| Gate | Resultado | Evidencia |
|---|---|---|
| CODE |  |  |
| BUILD |  |  |
| TEST |  |  |
| SECURITY |  |  |
| TRACEABILITY |  |  |

## Hallazgos y advertencias
- 

## Conclusión
<!-- Resultado global y condiciones, si las hay. -->
