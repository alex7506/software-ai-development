---
document_id: "{{id}}"
document_type: AI_SPECIFICATION
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
relations: []
---

# Especificación de IA — {{project_name}}

<!-- Cómo se usa la IA en este proyecto: como herramienta de desarrollo y, si aplica
     (uses_ai_in_product), como funcionalidad del producto. -->

## IA como herramienta de desarrollo
| Agente / herramienta | Proveedor | Tipo de destino | Capacidades concedidas | Autonomía máx. |
|---|---|---|---|---|
|  |  | enterprise_llm |  | 3 |

<!-- Debe coincidir con .ai-dev/configuration.yaml (providers y agents). -->

## Datos que puede recibir la IA
<!-- Clasificación máxima permitida por destino y medidas de minimización. -->

## Reglas locales
<!-- Políticas locales adicionales (.ai-dev/policies.yaml), si existen. -->

## IA como funcionalidad del producto
<!-- "No aplica" si uses_ai_in_product es false. Si aplica: casos de uso, modelo, datos de entrada,
     evaluación de calidad, manejo de errores y alucinaciones, costes y supervisión humana. -->
