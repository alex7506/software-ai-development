---
document_id: "{{id}}"
document_type: DATA_MODEL
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

# Modelo de datos — {{project_name}}

<!-- Obligatorio en STANDARD y CRITICAL si el producto almacena datos (has_persistent_data). -->

## Entidades
### <Entidad>
| Campo | Tipo | Obligatorio | Clasificación | Descripción |
|---|---|---|---|---|
| id |  | sí | INTERNAL |  |

## Relaciones
<!-- Cardinalidades, p. ej. USER 1:N TASK. -->

## Reglas de integridad y acceso
<!-- Quién puede leer y escribir cada entidad; aislamiento entre usuarios. -->

## Índices y consultas principales
- 

## Retención y borrado
<!-- Cuánto tiempo se conservan los datos y cómo se eliminan. -->

## Migraciones
<!-- Estrategia para cambios de esquema. -->
