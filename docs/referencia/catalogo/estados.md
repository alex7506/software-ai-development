<!-- Generado por `npm run docs:gen` desde la CLI y methodology/catalog. No editar a mano. -->

# Estados y transiciones

Fuente: `methodology/catalog/states.yaml`.

## `document_status`

`DRAFT` · `IN_REVIEW` · `APPROVED` · `OBSOLETE`

| Desde | Puede pasar a |
|---|---|
| `DRAFT` | `IN_REVIEW` |
| `IN_REVIEW` | `DRAFT`, `APPROVED` |
| `APPROVED` | `IN_REVIEW`, `OBSOLETE` |
| `OBSOLETE` | — (final) |

> APPROVED requiere approved_by humano. Un documento generado por IA nunca nace APPROVED.

## `requirement_status`

`PROPOSED` · `APPROVED` · `IMPLEMENTED` · `VERIFIED` · `REJECTED` · `DEPRECATED`

## `task_status`

`PENDING` · `READY` · `IN_PROGRESS` · `BLOCKED` · `WAITING_APPROVAL` · `REQUIRES_REVIEW` · `VALIDATING` · `COMPLETED` · `FAILED` · `CANCELLED`

| Desde | Puede pasar a |
|---|---|
| `PENDING` | `READY`, `BLOCKED`, `CANCELLED` |
| `READY` | `IN_PROGRESS`, `BLOCKED`, `CANCELLED` |
| `IN_PROGRESS` | `BLOCKED`, `WAITING_APPROVAL`, `REQUIRES_REVIEW`, `VALIDATING`, `FAILED`, `CANCELLED` |
| `BLOCKED` | `PENDING`, `READY`, `CANCELLED` |
| `WAITING_APPROVAL` | `IN_PROGRESS`, `CANCELLED` |
| `REQUIRES_REVIEW` | `IN_PROGRESS`, `VALIDATING`, `CANCELLED` |
| `VALIDATING` | `COMPLETED`, `IN_PROGRESS`, `FAILED` |
| `FAILED` | `READY`, `CANCELLED` |
| `COMPLETED` | — (final) |
| `CANCELLED` | — (final) |

> Un bloqueo por dependencia se expresa con status BLOCKED y el campo blocked_by (lista de IDs), nunca con estados compuestos como BLOCKED_BY_PREVIOUS_TASK.

## `project_status`

`ACTIVE` · `WAITING_APPROVAL` · `BLOCKED` · `ON_HOLD` · `CLOSED`

> El estado del proyecto es independiente de su fase (ver phases.yaml).

## `change_status`

`PROPOSED` · `ANALYZING` · `APPROVED` · `REJECTED` · `IMPLEMENTING` · `VALIDATING` · `DONE`

## `adr_status`

`PROPOSED` · `ACCEPTED` · `REJECTED` · `SUPERSEDED` · `DEPRECATED`

## `check_result`

`PASS` · `FAIL` · `BLOCKED` · `N_A`

## `validation_outcome`

`APPROVED` · `APPROVED_WITH_WARNINGS` · `REJECTED` · `BLOCKED` · `REQUIRES_HUMAN_REVIEW`

## `integrity_status`

`INTEGRITY_OK` · `WARNINGS` · `DEGRADED` · `BLOCKED`

> Ordenados de mejor a peor; un umbral mínimo admite su valor y los anteriores.

## `agent_output`

`SUCCESS` · `PARTIAL_SUCCESS` · `BLOCKED` · `FAILED` · `WAITING_APPROVAL` · `REQUIRES_REVIEW`

## `authorization_decision`

`ALLOW` · `DENY` · `REQUIRES_APPROVAL`

## `approval_decision`

`APPROVED` · `REJECTED` · `CHANGES_REQUESTED`

## `incident_severity`

`SEV1` · `SEV2` · `SEV3` · `SEV4`

> SEV1 servicio caído o datos comprometidos; SEV4 impacto cosmético.

## `relation_types`

`IMPLEMENTS` · `DEPENDS_ON` · `AFFECTS` · `DERIVED_FROM` · `VALIDATES` · `TESTS` · `DOCUMENTS` · `REPLACES` · `SUPERSEDES` · `CONFLICTS_WITH` · `BLOCKS` · `REQUIRES`

> Una relación inferida por IA debe declarar confidence (0–1) y no cuenta para INTEGRITY_OK hasta ser confirmada por una persona.

