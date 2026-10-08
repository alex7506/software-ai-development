# Ciclo y fases

Todo proyecto recorre el mismo ciclo de doce fases. No todas exigen el mismo esfuerzo: un prototipo pasa por algunas en minutos, y el [modo de rigor](modos-de-rigor.md) decide qué documentos son obligatorios en cada una.

```
INTAKE → DISCOVERY → DEFINITION → DESIGN → ARCHITECTURE → TECHNOLOGY → PLANNING
       → BOOTSTRAPPING → DEVELOPMENT → VALIDATION → RELEASE → EVOLUTION
```

## Qué pasa en cada fase

| Fase | Pregunta que responde | Resultado típico |
|---|---|---|
| **INTAKE** | ¿Qué problema queremos resolver? | Ficha de ingreso con problema, objetivo y alcance |
| **DISCOVERY** | ¿Qué necesitamos saber antes de decidir? | Resumen con contexto, riesgos y supuestos |
| **DEFINITION** | ¿Qué vamos a construir exactamente? | PRD y requisitos con criterios de aceptación |
| **DESIGN** | ¿Cómo lo vivirá el usuario? | Flujos y pantallas (si hay interfaz) |
| **ARCHITECTURE** | ¿Cómo se organiza el sistema? | Arquitectura, modelo de datos y decisiones (ADR) |
| **TECHNOLOGY** | ¿Con qué herramientas lo construimos? | Perfil tecnológico y diseño técnico |
| **PLANNING** | ¿En qué orden y en qué tareas? | Plan de implementación y tareas |
| **BOOTSTRAPPING** | ¿Está todo listo para programar? | Repositorio, configuración y asistentes preparados |
| **DEVELOPMENT** | Construir | Código, pruebas y evidencia por tarea |
| **VALIDATION** | ¿Cumple lo que prometimos? | Informe de validación con evidencia por requisito |
| **RELEASE** | Publicar de forma segura | Versión publicada con plan de vuelta atrás |
| **EVOLUTION** | Operar y cambiar | Solicitudes de cambio, correcciones, mantenimiento |

## Cómo se pasa de una fase a otra
Cada fase tiene:
- **Condición de entrada**: normalmente, que la anterior esté aprobada.
- **Entregables**: los documentos que exige según el modo de rigor y las características del producto (por ejemplo, el diseño UX solo si hay interfaz).
- **Gate**: controles que deben superarse (pruebas, seguridad, trazabilidad…).
- **Aprobador**: la persona que da el visto bueno. Siempre es humana.

Una fase no se cierra porque alguien diga "ya está": se cierra cuando los entregables existen, los controles pasan y el aprobador lo registra. La herramienta `ai-dev` comprobará todo esto (Fase 2 del desarrollo de la herramienta).

## Los cambios no rompen el ciclo
Una vez publicado el producto, el proyecto queda en EVOLUTION. Un cambio importante no se hace "por encima": entra como **solicitud de cambio**, se analiza su impacto y vuelve a la fase que corresponda (DEFINITION si cambia lo que hace el producto, ARCHITECTURE o TECHNOLOGY si cambia cómo está construido, PLANNING si solo afecta a la implementación).

## Valores exactos
Los entregables, gates y aprobadores exactos de cada fase están en `methodology/catalog/phases.yaml` y aparecerán en la sección Referencia de este manual.

## Siguiente
[Modos de rigor](modos-de-rigor.md)
