---
document_id: "{{id}}"
document_type: TEST_STRATEGY
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

# Estrategia de pruebas — {{project_name}}

<!-- Fase PLANNING. Obligatoria en STANDARD y CRITICAL. Ver methodology/05-quality-principles. -->

## Niveles de prueba
| Nivel | Alcance | Herramienta | Cuándo se ejecuta |
|---|---|---|---|
| Unitarias |  |  | En cada commit |
| Integración |  |  |  |
| Seguridad y autorización |  |  |  |
| Extremo a extremo |  |  |  |
| No funcionales |  |  |  |

## Cobertura de criterios de aceptación
<!-- Cómo se asegura que cada criterio de aceptación tenga al menos una prueba (relación TESTS). -->

## Datos de prueba
<!-- Origen de los datos; nunca datos reales CONFIDENTIAL o RESTRICTED sin anonimizar. -->

## Entornos
<!-- Dónde corre cada nivel: local, CI, staging. -->

## Criterios de salida
<!-- Qué debe cumplirse para superar el gate TEST. -->
