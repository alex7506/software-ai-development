# Líder técnico (TECH_LEAD)

Decides **cómo** se construye y eres responsable de que el trabajo de las personas y de los agentes de IA respete las reglas.

## Qué apruebas
ARCHITECTURE, TECHNOLOGY, PLANNING, BOOTSTRAPPING y DEVELOPMENT.

## Qué haces en cada momento
| Momento | Tu trabajo |
|---|---|
| Arquitectura | Elegir la estructura más simple que cumpla los requisitos no funcionales. Registrar cada decisión relevante como ADR. |
| Tecnología | Elegir el perfil tecnológico y justificar cada pieza. Comprobar que los proveedores de IA son compatibles con la clasificación de los datos. |
| Planificación | Revisar que cada tarea cumpla la Definition of Ready y que todo requisito aprobado tenga al menos una tarea. |
| Preparación | Configurar qué agentes de IA se usan, con qué permisos y con qué autonomía máxima. |
| Desarrollo | Revisar el trabajo de los agentes, atender las tareas en REQUIRES_REVIEW y aprobar el cierre de la fase. |

## Configurar los agentes de IA
En `.ai-dev/configuration.yaml` declaras:
- **Proveedores**: qué servicios de IA se usan y de qué tipo es cada uno (local, empresarial, público).
- **Agentes**: cada asistente, su tipo (DEVELOPER, TESTER…), sus permisos (`capabilities`) y su autonomía máxima.

Concede los permisos mínimos. Ningún agente puede tener el permiso de aprobar.

## Lo que debes vigilar
- **Sustituciones silenciosas.** Un agente que cambia una librería o un servicio sin ADR incumple una política bloqueante.
- **Dependencias nuevas.** Cada una necesita justificación y revisión (origen, mantenimiento, licencia, vulnerabilidades).
- **Reintentos agotados.** Una tarea que llega al límite de correcciones automáticas pasa a revisión: no la relances sin entender por qué falla.
