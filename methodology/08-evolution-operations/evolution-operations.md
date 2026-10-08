# Evolución y Operación

Corresponde a la fase EVOLUTION: el producto ya está en uso y el trabajo pasa a ser cambio controlado, operación y mantenimiento.

## Solicitudes de cambio
Todo cambio de alcance, requisito, arquitectura o tecnología aprobados entra por un `CHANGE_REQUEST` (`templates/documents/change-request.md`):

PROPUESTO → ANÁLISIS DE IMPACTO → DECISIÓN → IMPLEMENTACIÓN → VALIDACIÓN → CIERRE (`catalog/states.yaml#change_status`)

El análisis de impacto determina dónde reingresa el cambio al ciclo:

| Impacto | Reingresa en |
|---|---|
| Nuevo requisito o cambio de comportamiento | DEFINITION |
| Cambio estructural, de datos o de tecnología | ARCHITECTURE o TECHNOLOGY |
| Solo implementación (sin cambiar requisitos ni arquitectura) | PLANNING |

Una corrección de defecto sin cambio de requisitos no requiere CHANGE_REQUEST: es una tarea de tipo FIX.

## Incidentes
1. **Detectar y clasificar** con severidad SEV1–SEV4 (`catalog/states.yaml#incident_severity`).
2. **Contener**: priorizar la restauración del servicio (rollback, desactivar la funcionalidad) sobre la causa raíz.
3. **Corregir** mediante tareas FIX trazadas al incidente.
4. **Revisar** (obligatorio en SEV1 y SEV2): causa raíz, por qué no la detectaron los gates y acciones preventivas, registradas como tareas o CHANGE_REQUEST.

Las operaciones en producción durante un incidente siguen siendo riesgo CRITICAL: un agente puede diagnosticar y proponer; la ejecución la confirma una persona.

## Rollback
Todo RELEASE declara cómo revertirse (`templates/documents/release.md`). Un rollback no verificado antes del despliegue impide superar el gate RELEASE en modos STANDARD y CRITICAL.

## Deuda técnica
La deuda se registra como tareas TECHNICAL o CHORE con la etiqueta `debt` y su justificación. No se acumula en comentarios del código ni en la memoria de una conversación.

## Mantenimiento de dependencias
La actualización de dependencias es una tarea CHORE con riesgo según `agents/capabilities.yaml#dependency_change`. Las vulnerabilidades críticas o altas se tratan como FIX prioritario.
