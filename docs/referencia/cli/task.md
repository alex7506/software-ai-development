<!-- Generado por `npm run docs:gen` desde la CLI y methodology/catalog. No editar a mano. -->

# `ai-dev task`

Crea tareas y gestiona su ciclo de vida.

## `ai-dev task new`

Crea una tarea. Una FEATURE implementa al menos un requisito; las demás requieren --justification.

```
ai-dev task new [opciones]
```

**Opciones**

| Opción | Descripción |
|---|---|
| `--title <título>` (obligatoria) | Título de la tarea. |
| `--kind <tipo>` | Tipo de tarea. Valores: `FEATURE`, `TECHNICAL`, `CHORE`, `FIX`. Por defecto: `FEATURE`. |
| `--objective <texto>` | Objetivo (por defecto, el título). |
| `--implements <req>` | Requisito que implementa (repetible). |
| `--criterion <texto>` | Criterio de aceptación (repetible). |
| `--depends-on <task>` | Tarea de la que depende (repetible). |
| `--justification <texto>` | Justificación (obligatoria si no es FEATURE). |
| `--risk <nivel>` | LOW, MEDIUM, HIGH, CRITICAL. Por defecto: `MEDIUM`. |
| `--data <nivel>` | Clasificación de datos: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED. Por defecto: `INTERNAL`. |
| `--capability <capacidad>` | Capacidad requerida (repetible). |
| `--executor <ejecutor>` | LLM, AGENT, CLI, SCRIPT, API, IDE, HUMAN, DETERMINISTIC_TOOL. Por defecto: `AGENT`. |
| `--assignee <nombre>` | Responsable de ejecutarla. |
| `--author <nombre>` | Autor (por defecto, git user.name). |

## `ai-dev task list`

Lista las tareas.

```
ai-dev task list [opciones]
```

**Opciones**

| Opción | Descripción |
|---|---|
| `--status <estado>` | Filtra por estado. |

## `ai-dev task ready`

Marca la tarea como lista (comprueba la Definition of Ready).

```
ai-dev task ready <id>
```

**Argumentos**

| Argumento | Descripción |
|---|---|
| `id` | ID de la tarea |

## `ai-dev task start`

Empieza o reanuda la tarea y la fija como tarea actual.

```
ai-dev task start <id>
```

**Argumentos**

| Argumento | Descripción |
|---|---|
| `id` | ID de la tarea |

## `ai-dev task review`

Pide revisión humana de la tarea.

```
ai-dev task review <id>
```

**Argumentos**

| Argumento | Descripción |
|---|---|
| `id` | ID de la tarea |

## `ai-dev task wait`

Deja la tarea esperando una aprobación externa.

```
ai-dev task wait <id>
```

**Argumentos**

| Argumento | Descripción |
|---|---|
| `id` | ID de la tarea |

## `ai-dev task validate`

Pasa la tarea a validación.

```
ai-dev task validate <id>
```

**Argumentos**

| Argumento | Descripción |
|---|---|
| `id` | ID de la tarea |

## `ai-dev task complete`

Cierra la tarea (comprueba la Definition of Done y ejecuta los gates configurados).

```
ai-dev task complete <id> [opciones]
```

**Argumentos**

| Argumento | Descripción |
|---|---|
| `id` | ID de la tarea |

**Opciones**

| Opción | Descripción |
|---|---|
| `--reviewed-by <nombre>` | Persona que revisó la tarea. |

## `ai-dev task block`

Bloquea la tarea por una dependencia o un motivo.

```
ai-dev task block <id> [opciones]
```

**Argumentos**

| Argumento | Descripción |
|---|---|
| `id` | ID de la tarea |

**Opciones**

| Opción | Descripción |
|---|---|
| `--by <task>` | Tarea que la bloquea (repetible). |
| `--reason <texto>` | Motivo del bloqueo. |

## `ai-dev task cancel`

Pasa la tarea a CANCELLED.

```
ai-dev task cancel <id> [opciones]
```

**Argumentos**

| Argumento | Descripción |
|---|---|
| `id` | ID de la tarea |

**Opciones**

| Opción | Descripción |
|---|---|
| `--reason <texto>` (obligatoria) | Motivo. |

## `ai-dev task fail`

Pasa la tarea a FAILED.

```
ai-dev task fail <id> [opciones]
```

**Argumentos**

| Argumento | Descripción |
|---|---|
| `id` | ID de la tarea |

**Opciones**

| Opción | Descripción |
|---|---|
| `--reason <texto>` (obligatoria) | Motivo. |

## `ai-dev task evidence`

Registra evidencia de un criterio de aceptación.

```
ai-dev task evidence <id> [opciones]
```

**Argumentos**

| Argumento | Descripción |
|---|---|
| `id` | ID de la tarea |

**Opciones**

| Opción | Descripción |
|---|---|
| `--criterion <AC-n>` (obligatoria) | Criterio de aceptación. |
| `--type <tipo>` (obligatoria) | Tipo de evidencia. Valores: `TEST_RUN`, `REPORT`, `COMMIT`, `SCREENSHOT`, `LOG`, `REVIEW`, `MANUAL_CHECK`. |
| `--ref <referencia>` (obligatoria) | Referencia verificable (salida de comando, commit, ruta del informe…). |

## `ai-dev task attempt`

Registra un intento automático de corrección; al llegar al límite la tarea pasa a REQUIRES_REVIEW.

```
ai-dev task attempt <id> [opciones]
```

**Argumentos**

| Argumento | Descripción |
|---|---|
| `id` | ID de la tarea |

**Opciones**

| Opción | Descripción |
|---|---|
| `--note <texto>` | Qué falló. |

## `ai-dev task provenance`

Registra qué agente o modelo de IA ejecutó la tarea.

```
ai-dev task provenance <id> [opciones]
```

**Argumentos**

| Argumento | Descripción |
|---|---|
| `id` | ID de la tarea |

**Opciones**

| Opción | Descripción |
|---|---|
| `--generated-by <agente>` (obligatoria) | Agente o herramienta. |
| `--model <modelo>` | Modelo. |
| `--model-version <versión>` | Versión del modelo. |
| `--context-ref <ref>` | Referencia al contexto usado. |

