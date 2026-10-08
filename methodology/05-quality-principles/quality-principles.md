# Principios de Calidad

Calidad = cumplimiento + corrección + seguridad + verificabilidad + mantenibilidad + adecuación.

Resultado de cada control: PASS / FAIL / BLOCKED / N_A (`catalog/states.yaml#check_result`).

Resultado global: APPROVED / APPROVED_WITH_WARNINGS / REJECTED / BLOCKED / REQUIRES_HUMAN_REVIEW (`catalog/states.yaml#validation_outcome`).

Gates: CODE → BUILD → TEST → SECURITY → TRACEABILITY → VALIDATION → RELEASE. Definición en `catalog/phases.yaml#gates`; los exigidos por modo, en `catalog/modes.yaml`.

## Estrategia de pruebas
Cada proyecto la define en `TEST_STRATEGY` (obligatoria desde STANDARD; en LITE basta una sección en el plan de implementación). Debe establecer:

| Nivel | Qué verifica | Mínimo esperado |
|---|---|---|
| Unitarias | Lógica de negocio aislada | Toda regla de negocio del PRD |
| Integración | Interacción con datos, autenticación y servicios | Todo flujo que cruce un límite del sistema |
| Seguridad y autorización | Que cada usuario solo accede a lo suyo | Toda regla de aislamiento y permiso |
| Extremo a extremo | Flujos completos del usuario | Los flujos críticos del PRD |
| No funcionales | Rendimiento, accesibilidad, disponibilidad | Cada NFR con criterio medible |

- Cada criterio de aceptación de un requisito tiene al menos una prueba que lo verifica (relación TESTS).
- El umbral de cobertura, si se usa, lo fija el proyecto; nunca sustituye a la cobertura de criterios de aceptación.
- Las pruebas generadas por IA se revisan como cualquier otro código: una prueba que siempre pasa no es evidencia.

No se deshabilitan pruebas para obtener PASS y no se hacen afirmaciones de éxito sin evidencia.
