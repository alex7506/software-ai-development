# Esquemas

JSON Schema (draft 2020-12) escritos en YAML. Validan el frontmatter de los documentos y los archivos de configuración de los proyectos.

## Enums: sin duplicar el catálogo
Los esquemas **no copian** valores del catálogo. Referencian `enums.schema.yaml#/$defs/<nombre>`, un esquema que la herramienta construye en memoria a partir de `methodology/catalog/` al cargar los esquemas. Así un estado nuevo en `states.yaml` queda validado sin tocar ningún esquema.

| `$defs` de `enums` | Origen |
|---|---|
| `document_status`, `task_status`, `requirement_status`, `adr_status`, `change_status`, `project_status`, `check_result`, `validation_outcome`, `integrity_status`, `approval_decision`, `relation_type`, `incident_severity` | `states.yaml` |
| `document_type` | `document-types.yaml#types` |
| `phase` | `phases.yaml#order` |
| `mode` | `modes.yaml#order` |
| `role`, `human_role`, `agent_type` | `roles.yaml` |
| `risk_level` | `risk.yaml#levels` |
| `data_classification`, `destination_type` | `data-classification.yaml` |
| `capability` | `agents/capabilities.yaml#capabilities` |
| `policy_id` | `agents/policies/agent-policies.yaml` |
| `executor` | `lifecycle.yaml#executors` |
| `task_kind` | `definitions.yaml#task_kinds` |
| `project_feature` | `phases.yaml#project_features` |

## Archivos
| Esquema | Valida |
|---|---|
| `common.schema.yaml` | Definiciones compartidas: IDs, versión, fecha, relación, procedencia, evidencia. |
| `document.schema.yaml` | Frontmatter de cualquier documento sin esquema propio. |
| `task.schema.yaml`, `adr.schema.yaml`, `change-request.schema.yaml`, `release.schema.yaml`, `validation-report.schema.yaml` | Frontmatter de esos tipos (ver `document-types.yaml#types.*.schema`). |
| `requirements.schema.yaml` | `docs/01-product/requirements.yaml`. |
| `ai-dev-methodology.schema.yaml`, `ai-dev-configuration.schema.yaml`, `ai-dev-policies.schema.yaml`, `ai-dev-state.schema.yaml`, `approvals.schema.yaml` | Archivos de `.ai-dev/`. |
| `agent.schema.yaml` | Registro de un agente concreto en `configuration.yaml#agents`. |
