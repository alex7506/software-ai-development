<!-- Generado por `npm run docs:gen` desde la CLI y methodology/catalog. No editar a mano. -->

# Riesgo, autonomía y clasificación de datos

Fuentes: `methodology/catalog/risk.yaml`, `methodology/catalog/data-classification.yaml`, `agents/capabilities.yaml`.

## Niveles de riesgo

| Riesgo | Autonomía máxima | Aprobación |
|---|---|---|
| `LOW` | 4 | `none` |
| `MEDIUM` | 3 | `post_review` |
| `HIGH` | 2 | `pre_approval` |
| `CRITICAL` | 1 | `pre_approval_human_executes` |

## Capacidades

| Capacidad | Riesgo base |
|---|---|
| `analysis` | `LOW` |
| `requirements_analysis` | `LOW` |
| `architecture_design` | `HIGH` |
| `documentation` | `LOW` |
| `code_generation` | `MEDIUM` |
| `code_modification` | `MEDIUM` |
| `test_generation` | `MEDIUM` |
| `test_execution` | `LOW` |
| `security_analysis` | `LOW` |
| `dependency_analysis` | `LOW` |
| `dependency_change` | `HIGH` |
| `git_read` | `LOW` |
| `git_write` | `MEDIUM` |
| `commit` | `MEDIUM` |
| `git_push` | `HIGH` |
| `deployment` | `HIGH` |
| `production_deployment` | `CRITICAL` |
| `db_read` | `MEDIUM` |
| `db_write` | `HIGH` |
| `secrets_management` | `CRITICAL` |
| `destructive_operation` | `CRITICAL` |
| `approval` | `CRITICAL` (solo personas) |

## Clasificación de datos

| Nivel | Riesgo | Destinos permitidos |
|---|---|---|
| `PUBLIC` | `LOW` | `local_model`, `enterprise_llm`, `public_llm`, `third_party_tool` |
| `INTERNAL` | `MEDIUM` | `local_model`, `enterprise_llm`, `third_party_tool` |
| `CONFIDENTIAL` | `HIGH` | `local_model`, `enterprise_llm` |
| `RESTRICTED` | `CRITICAL` | ninguno |

## Tipos de destino

| Destino | Significado |
|---|---|
| `local_model` | Modelo ejecutado en infraestructura controlada por la organización. |
| `enterprise_llm` | LLM externo con contrato que excluye entrenamiento y garantiza retención limitada. |
| `public_llm` | LLM externo sin garantías contractuales de privacidad. |
| `third_party_tool` | Servicio externo distinto de un LLM (CI, analítica, monitorización). |
