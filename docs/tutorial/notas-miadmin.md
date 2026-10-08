# Notas del piloto MiAdmin

Registro de fricciones encontradas al usar la metodología y `ai-dev` en un proyecto real e independiente ([MiAdmin](https://github.com/alex7506/miadmin)). Cada entrada termina en una corrección con prueba, un cambio de la metodología o una decisión de no actuar.

## Balance (2026-10-08)
MiAdmin recorrió el ciclo completo en modo LITE, de INTAKE a EVOLUTION, en un día:
- 13 documentos, 5 requisitos y 4 tareas, todos con evidencia.
- 20 aprobaciones humanas en 2 sesiones de `ai-dev review`.
- 18 pruebas del producto y release `v0.1.0`.

| Resultado | Fricciones |
|---|---|
| Corregidas en la herramienta, con prueba | 1, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 17, 18, 19, 20 |
| Controles que funcionaron como se esperaba | 14, 15 |
| Decisiones documentadas de no actuar | 2, 9, 16 |
| Pendientes | — |

El hallazgo más importante fue la 7: los requisitos podían aprobarse sin intervención humana. Era un hueco en el control central de la metodología y quedó cerrado.

## Registro

| # | Fase | Fricción | Impacto | Acción |
|---|---|---|---|---|
| 1 | Planificación | Una política local no puede exigir un entregable adicional (MiAdmin necesita QUALITY_SECURITY en STANDARD); hoy la política es solo texto y `phase check` no la aplica. | Un control de seguridad depende de la memoria del equipo. | **Corregido** (1.0.0): `additional_deliverables` en `configuration.yaml`, aplicado por `phase check`. |
| 2 | Planificación | CRITICAL exige dos aprobadores distintos: inviable para una persona sola, aunque el producto guarde credenciales. | Obliga a bajar a STANDARD y compensar con políticas locales. | Decisión (1.0.0): no actuar. CRITICAL exige dos personas por diseño; un responsable único usa STANDARD con `additional_deliverables` y políticas locales (documentado en Modos de rigor). |
| 3 | INTAKE | `validate` muestra "1 documentos, 0 requisitos" (plural fijo). | Cosmético. | **Corregido** (con prueba). |
| 4 | INTAKE | Para declarar `providers` hay que conocer las condiciones de privacidad del plan de IA usado, y el responsable no siempre las conoce al empezar. | Sin proveedor declarado, las reglas de clasificación de datos no indican qué puede recibir el agente. | **Corregido** (1.0.0): guía "Cómo clasificar un proveedor de IA" en Riesgo y autonomía. |
| 5 | INTAKE | `data-classification.yaml` solo distingue `enterprise_llm` (con contrato) y `public_llm`. Un plan de consumo con opción de no entrenar (p. ej. Claude Pro) no encaja bien: como `public_llm`, el agente no podría recibir ni el código del proyecto (INTERNAL). | La regla es correcta pero inaplicable para un desarrollador individual; invita a ignorarla. | **Corregido** (1.0.0): nuevo destino `consumer_llm_no_training`, que puede recibir hasta INTERNAL. |
| 6 | INTAKE | El plazo real (2 días) y el alcance deseado chocaron; la plantilla de intake no tiene un apartado de plazo ni de prioridades de recorte. | El ajuste de alcance quedó en "Fuera de alcance" sin criterio explícito. | **Corregido** (1.0.0): sección "Plazo y criterio de recorte" en la plantilla de intake. |
| 7 | INTAKE | Los requisitos no tenían aprobación humana: cualquiera, incluido un agente, podía marcarlos `APPROVED` editando `requirements.yaml`, y con eso desbloquear tareas (Definition of Ready). | Hueco de gobierno: el control central (aprobación humana) se podía sortear. | **Corregido**: `ai-dev approve REQUIREMENTS` con huella del contenido aprobado; `validate` y `phase check` lo exigen. |
| 8 | INTAKE | Con una persona en todos los roles, recorrer el ciclo exigía ~20 comandos `approve` y `phase advance` intercalados con el trabajo del agente. | Fricción alta; invita a abandonar la metodología en proyectos pequeños. | **Corregido**: `ai-dev review`, sesión interactiva que aprueba documentos, requisitos y fases listas y avanza sola; bloqueada para agentes. |
| 9 | Planificación | El piloto no puede ejecutarse de forma autónoma: cada aprobación requiere a la persona. | Esperado y deseado (es el control central), pero conviene planificar las sesiones de aprobación. | Decisión: no actuar. El tutorial indicará los puntos de aprobación. |
| 10 | INTAKE | Cambiar el modo de rigor (STANDARD → LITE) antes de la primera aprobación no tiene un procedimiento: la norma pide un CHANGE_REQUEST, pero esos solo reingresan desde EVOLUTION. | Se resolvió editando `methodology.yaml` sin rastro formal. | **Corregido** (1.0.0): `ai-dev mode <MODO> --reason`, bloqueado en cuanto existe una aprobación. |
| 11 | DEVELOPMENT | `trace --git` marca como "sin trailer" los commits de documentación hechos antes de existir tareas (INTAKE, plan, registro de aprobaciones). | Ruido en la trazabilidad; en STANDARD bajaría la integridad sin que haya un problema real. | **Corregido** (1.0.0): `trace --git` no cuenta los commits que solo tocan documentación y configuración de la metodología; en MiAdmin la integridad pasa de WARNINGS a INTEGRITY_OK. |
| 12 | RELEASE | La release debe estar completa (fecha, etiqueta) antes de aprobarse, pero se publica después de aprobarla: actualizar `released_at` tras aprobar invalidaría la aprobación. | Obliga a fijar la fecha por adelantado. | **Corregido** (1.0.0): `released_at` no forma parte de la huella. |
| 13 | VALIDATION | `ai-dev review` ofrecía aprobar la release antes que el informe de validación (orden de carpetas, no de fases). | Orden de revisión confuso. | **Corregido** (con prueba): los documentos se ofrecen en el orden de las fases. |
| 14 | DEVELOPMENT | (Positivo) El gate SECURITY detectó vulnerabilidades críticas en Vitest 2 y Vite 5 al configurar el proyecto. | Se actualizó a versiones seguras antes de escribir código. | El control funcionó. Nota: la propia CLI usa Vitest 2.1.8; revisar sus dependencias antes de la 1.0.0. |
| 15 | DEVELOPMENT | (Positivo) Probar la interfaz requería una dependencia no aprobada (jsdom); la política `no_unapproved_dependencies` impidió añadirla en silencio y la limitación quedó documentada en la validación. | Interfaz verificada manualmente. | El control funcionó. |
| 16 | DEVELOPMENT | Una incógnita de un documento aprobado (proveedor de IA en el INTAKE) se resolvió después; actualizar el INTAKE invalidaría su aprobación y obligaría a `revise` + nueva aprobación por un cambio menor. | Se registró en `.ai-dev/configuration.yaml`, que es su lugar definitivo, pero el INTAKE sigue mostrando la incógnita abierta. | Decisión (1.0.0): un documento aprobado es una foto de su momento; las resoluciones se registran donde vive el dato (estándar de trabajo). |
| 17 | EVOLUTION | `ai-dev status` pedía aprobar EVOLUTION, que es la fase final y no se cierra. | Mensaje engañoso al terminar el ciclo. | **Corregido**: `status` explica que en EVOLUTION los cambios entran con CHANGE_REQUEST y `phase reenter`. |
| 18 | 1.0.0 | Al excluir `released_at` de la huella cambió su cálculo y las aprobaciones de la 0.9.0 dejaron de coincidir (detectado al validar MiAdmin con la CLI nueva). Además, la CLI aplica siempre su propia versión de la metodología aunque el proyecto fije otra. | Un cambio interno invalidaba aprobaciones humanas legítimas. | **Corregido**: se aceptan también las huellas de la 0.9.0, con prueba. La versión fijada solo se avisa (`doctor`, `validate`); usar la CLI de la misma versión que fija el proyecto queda documentado como limitación. |
| 19 | EVOLUTION (CHANGE-001) | El commit que sube la versión de la release toca `package.json` sin pertenecer a ninguna tarea, y `trace --git` lo contaba como commit sin trazar. | La integridad bajaba a WARNINGS por trabajo legítimo de release. | **Corregido** (1.1.0): trailers `Release: REL-NNN` y `Change: CHANGE-NNN`, con comprobación de que el documento existe. |
| 20 | EVOLUTION (CHANGE-001) | Aprobar una solicitud de cambio y reingresar al ciclo exigía una sesión de revisión y un `phase reenter` manual antes de la siguiente sesión. | Una sesión humana más por cada cambio. | **Corregido** (1.1.0): `ai-dev review` reingresa automáticamente tras aprobar el cambio y continúa; `phase reenter` marca el cambio como IMPLEMENTING y no lo aplica dos veces. |
