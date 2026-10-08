# Principios de Calidad

Calidad = cumplimiento + corrección + seguridad + verificabilidad + mantenibilidad + adecuación.

Resultado de cada control: PASS / FAIL / BLOCKED / N_A (`catalog/states.yaml#check_result`).

Resultado global: APPROVED / APPROVED_WITH_WARNINGS / REJECTED / BLOCKED / REQUIRES_HUMAN_REVIEW (`catalog/states.yaml#validation_outcome`).

Gates: CODE → BUILD → TEST → SECURITY → TRACEABILITY → VALIDATION → RELEASE. Definición en `catalog/phases.yaml#gates`; los exigidos por modo, en `catalog/modes.yaml`.

No se deshabilitan pruebas para obtener PASS y no se hacen afirmaciones de éxito sin evidencia.
