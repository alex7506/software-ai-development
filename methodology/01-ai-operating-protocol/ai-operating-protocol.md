# Protocolo Operativo IA V1.0

## Ciclo operativo
Solicitud → Contexto → Análisis → Plan → Autorización → Implementación → Pruebas → Revisión → Documentación → Cierre

## Contexto mínimo suficiente
Cada ejecución recibe solo la información necesaria para realizar la tarea, priorizando requisitos, dependencias, políticas, estado, archivos afectados y evidencia relevante.

## Autorización
Entrada mínima: AGENTE + TAREA + CONTEXTO + CAPACIDAD + PERMISOS + POLÍTICAS + RIESGO + ESTADO.
Resultado: ALLOW / DENY / REQUIRES_APPROVAL.

## Reglas
- No ampliar alcance.
- No escalar permisos.
- No sustituir tecnología silenciosamente.
- No incluir secretos en código, documentos, prompts o logs.
- Máximo 3 ciclos automáticos de corrección.
- Si falta información crítica: bloquear o solicitar decisión.
