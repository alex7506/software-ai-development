# Protocolo Operativo IA

## Ciclo operativo
Solicitud → Contexto → Análisis → Plan → Autorización → Implementación → Pruebas → Revisión → Documentación → Cierre

Es una vista del ciclo canónico de ejecución; el mapeo paso a paso está en `catalog/lifecycle.yaml`.

## Contexto mínimo suficiente
Cada ejecución recibe solo la información necesaria para realizar la tarea, priorizando requisitos, dependencias, políticas, estado, archivos afectados y evidencia relevante.

## Autorización
Entrada mínima: AGENTE + TAREA + CONTEXTO + CAPACIDAD + PERMISOS + POLÍTICAS + RIESGO + CLASIFICACIÓN DE DATOS + ESTADO.
Resultado: ALLOW / DENY / REQUIRES_APPROVAL (`catalog/states.yaml#authorization_decision`).

## Reglas
Las reglas son las políticas de `agents/policies/agent-policies.yaml`. En particular:
- No ampliar alcance ni escalar permisos.
- No sustituir tecnología silenciosamente.
- No incluir secretos en código, documentos, prompts, logs ni commits.
- No superar `max_auto_fix_attempts` (`catalog/limits.yaml`); al alcanzarlo, la tarea pasa a REQUIRES_REVIEW.
- No aprobar nunca: la aprobación es humana.
- Si falta información crítica: marcar UNKNOWN, bloquear o solicitar decisión.
