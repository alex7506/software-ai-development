---
document_id: "{{id}}"
document_type: TASK
title: "{{title}}"
version: 0.1.0
status: PENDING
project: "{{project_id}}"
methodology_version: "{{methodology_version}}"
created_at: "{{date}}"
updated_at: "{{date}}"
author: "{{author}}"
approved_by: null
source_of_truth: true
kind: FEATURE
objective: "{{objective}}"
risk: MEDIUM
data_classification: INTERNAL
capabilities: [code_modification, test_generation]
executor: AGENT
assignee: null
reviewed_by: null
context_sources: []
constraints: []
acceptance_criteria:
  - id: AC-1
    description: "{{acceptance_criterion}}"
blocked_by: []
evidence: []
auto_fix_attempts: 0
relations:
  - type: IMPLEMENTS
    target: "{{requirement_id}}"
---

# {{id}} — {{title}}

<!-- Los campos estructurados (riesgo, capacidades, criterios, evidencia) viven en el frontmatter.
     Si kind no es FEATURE, sustituye la relación IMPLEMENTS por `justification`. -->

## Contexto
<!-- Qué necesita saber quien ejecute la tarea y dónde está (enlaces a requisitos, ADR, archivos). -->

## Enfoque propuesto
<!-- Pasos previstos. Lo completa quien ejecuta antes de empezar (Plan). -->

## Notas de ejecución
<!-- Decisiones tomadas durante la ejecución, intentos fallidos, preguntas abiertas. -->
