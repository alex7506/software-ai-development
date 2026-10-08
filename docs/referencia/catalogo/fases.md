<!-- Generado por `npm run docs:gen` desde la CLI y methodology/catalog. No editar a mano. -->

# Fases

Fuente: `methodology/catalog/phases.yaml`.

INTAKE → DISCOVERY → DEFINITION → DESIGN → ARCHITECTURE → TECHNOLOGY → PLANNING → BOOTSTRAPPING → DEVELOPMENT → VALIDATION → RELEASE → EVOLUTION

Un entregable es obligatorio si el modo del proyecto es igual o superior a su modo mínimo y, si tiene condición, la característica está activa en `.ai-dev/configuration.yaml`.

## INTAKE

Registrar la idea, el problema, el objetivo y el alcance inicial.

- **Entrada:** Existe una solicitud de proyecto.
- **Salida:** Intake con problema, objetivo, alcance y fuera de alcance; incógnitas marcadas como UNKNOWN.
- **Aprueba:** `PRODUCT_OWNER`

| Entregable | Desde el modo | Condición |
|---|---|---|
| `PROJECT_INTAKE` | LITE | — |

## DISCOVERY

Investigar contexto, usuarios, restricciones y riesgos.

- **Entrada:** INTAKE aprobado.
- **Salida:** Riesgos, supuestos y restricciones documentados; clasificación de datos y modo de rigor propuestos.
- **Aprueba:** `PRODUCT_OWNER`

| Entregable | Desde el modo | Condición |
|---|---|---|
| `PROJECT_SUMMARY` | STANDARD | — |

## DEFINITION

Definir qué se construye y cómo se acepta.

- **Entrada:** DISCOVERY aprobado (o INTAKE en LITE).
- **Salida:** Cada requisito FR/NFR tiene criterio de aceptación verificable y estado APPROVED.
- **Aprueba:** `PRODUCT_OWNER`

| Entregable | Desde el modo | Condición |
|---|---|---|
| `PRD` | LITE | — |
| `REQUIREMENTS` | LITE | — |

## DESIGN

Diseñar la experiencia y la interacción.

- **Entrada:** DEFINITION aprobado.
- **Salida:** Flujos principales cubren los requisitos FR con interfaz.
- **Aprueba:** `PRODUCT_OWNER`

| Entregable | Desde el modo | Condición |
|---|---|---|
| `UX_UI` | STANDARD | `has_ui` |

## ARCHITECTURE

Decidir la estructura del sistema sin fijar aún proveedores concretos.

- **Entrada:** DEFINITION aprobado (y DESIGN si aplica).
- **Salida:** Decisiones relevantes registradas como ADR ACCEPTED; NFR cubiertos por la arquitectura.
- **Aprueba:** `TECH_LEAD`

| Entregable | Desde el modo | Condición |
|---|---|---|
| `ARCHITECTURE` | LITE | — |
| `DATA_MODEL` | STANDARD | `has_persistent_data` |
| `ADR` | STANDARD | — |

## TECHNOLOGY

Seleccionar tecnologías y perfil tecnológico con justificación.

- **Entrada:** ARCHITECTURE aprobado.
- **Salida:** Cada tecnología tiene justificación y ADR; la clasificación de datos es compatible con los proveedores elegidos.
- **Aprueba:** `TECH_LEAD`

| Entregable | Desde el modo | Condición |
|---|---|---|
| `TECHNOLOGY_PROFILE` | LITE | — |
| `TECH_DESIGN` | STANDARD | — |
| `API_SPECIFICATION` | STANDARD | `has_api` |
| `AI_SPECIFICATION` | STANDARD | — |

## PLANNING

Descomponer el trabajo en tareas trazables.

- **Entrada:** TECHNOLOGY aprobado.
- **Salida:** Toda tarea cumple Definition of Ready y todo requisito APPROVED tiene al menos una tarea que lo implementa.
- **Aprueba:** `TECH_LEAD`

| Entregable | Desde el modo | Condición |
|---|---|---|
| `IMPLEMENTATION_PLAN` | LITE | — |
| `TASK` | LITE | — |
| `TEST_STRATEGY` | STANDARD | — |
| `QUALITY_SECURITY` | CRITICAL | — |

## BOOTSTRAPPING

Preparar repositorio, entorno, configuración .ai-dev y adaptadores de agentes.

- **Entrada:** PLANNING aprobado.
- **Salida:** Proyecto READY_FOR_DEVELOPMENT; validate sin errores.
- **Aprueba:** `TECH_LEAD`
- **Comprobaciones:** `git_initialized`, `ai_dev_valid`, `adapters_generated`, `secrets_excluded`

## DEVELOPMENT

Implementar tareas bajo el protocolo operativo IA.

- **Entrada:** BOOTSTRAPPING aprobado.
- **Salida:** Todas las tareas planificadas en COMPLETED o CANCELLED con justificación.
- **Aprueba:** `TECH_LEAD`
- **Gates:** `CODE`, `BUILD`, `TEST`, `SECURITY`
- **Comprobaciones:** `planned_tasks_closed`

## VALIDATION

Verificar con evidencia que el producto cumple los requisitos.

- **Entrada:** DEVELOPMENT aprobado.
- **Salida:** Resultado APPROVED o APPROVED_WITH_WARNINGS; trazabilidad >= traceability_minimum del modo.
- **Aprueba:** `QA_LEAD`
- **Gates:** `TRACEABILITY`, `VALIDATION`

| Entregable | Desde el modo | Condición |
|---|---|---|
| `VALIDATION_REPORT` | LITE | — |

## RELEASE

Publicar una versión controlada y reversible.

- **Entrada:** VALIDATION aprobado.
- **Salida:** Versión desplegada, plan de rollback verificado y CHANGELOG actualizado.
- **Aprueba:** `PRODUCT_OWNER`
- **Gates:** `RELEASE`

| Entregable | Desde el modo | Condición |
|---|---|---|
| `RELEASE` | LITE | — |
| `DEPLOYMENT_OPERATIONS` | STANDARD | — |

## EVOLUTION

Operar, mantener e incorporar cambios.

- **Entrada:** RELEASE aprobado.
- **Salida:** Cada cambio aprobado reingresa al ciclo en DEFINITION, ARCHITECTURE o PLANNING según su impacto.
- **Aprueba:** `PRODUCT_OWNER`

| Entregable | Desde el modo | Condición |
|---|---|---|
| `CHANGE_REQUEST` | LITE | `on_change` |

## Gates

| Gate | Qué exige |
|---|---|
| `CODE` | Lint, formato y revisión de código sin hallazgos bloqueantes. |
| `BUILD` | Compilación o empaquetado reproducible sin errores. |
| `TEST` | Pruebas definidas en TEST_STRATEGY en PASS; ninguna prueba deshabilitada para obtenerlo. |
| `SECURITY` | Sin secretos expuestos ni vulnerabilidades críticas o altas sin aceptación de riesgo. |
| `TRACEABILITY` | Integridad >= traceability_minimum del modo. |
| `VALIDATION` | VALIDATION_REPORT con evidencia por requisito. |
| `RELEASE` | Versión, CHANGELOG, aprobación y plan de rollback presentes. |

## Características del producto

| Característica | Significado |
|---|---|
| `has_ui` | El producto tiene interfaz de usuario. |
| `has_api` | El producto expone una API a terceros o a otros sistemas. |
| `has_persistent_data` | El producto almacena datos de forma persistente. |
| `uses_ai_in_product` | El producto incorpora IA como funcionalidad (no solo como herramienta de desarrollo). |
