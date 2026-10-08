# Guía Maestra — Software AI Development Methodology

> Versión de la metodología: ver `VERSION`. Valores normativos (estados, fases, roles, límites): `methodology/catalog/`.

## Propósito
Establecer un método controlado para desarrollar software con apoyo de IA manteniendo control humano, trazabilidad, seguridad, calidad, eficiencia y reproducibilidad.

## Independencia
La metodología es independiente de proveedor, LLM, modelo, IDE, agente, framework, nube y plataforma. Las tecnologías concretas entran solo como **perfiles tecnológicos** (`technology-profiles/`) y **adaptadores** (`adapters/`), nunca en el núcleo.

## Principios
1. El proyecto tiene una fuente de verdad persistente; la conversación no lo es.
2. La IA no modifica silenciosamente requisitos, arquitectura o alcance aprobado.
3. Capacidad ≠ permiso ≠ autorización.
4. Contexto mínimo suficiente.
5. Operaciones deterministas antes que LLM cuando sea posible.
6. Validación basada en evidencia.
7. La seguridad prevalece sobre el ahorro de tokens.
8. Los cambios relevantes requieren trazabilidad y aprobación proporcional al riesgo.
9. `UNKNOWN` es un estado válido; no se inventan hechos.
10. La aprobación es exclusivamente humana; quien produce no aprueba.
11. Cada dato normativo vive en un solo lugar (`methodology/catalog/`).
12. La metodología es finita y versionada.

## Ciclo del proyecto
INTAKE → DISCOVERY → DEFINITION → DESIGN → ARCHITECTURE → TECHNOLOGY → PLANNING → BOOTSTRAPPING → DEVELOPMENT → VALIDATION → RELEASE → EVOLUTION

Entradas, entregables, salidas, gates y aprobadores de cada fase: `catalog/phases.yaml`.

## Modos de rigor
LITE · STANDARD · CRITICAL — determinan qué entregables son obligatorios, qué gates aplican y la autonomía máxima (`catalog/modes.yaml`).

## Autonomía y riesgo
Niveles 0 Manual · 1 Asistida · 2 Controlada · 3 Autónoma limitada · 4 Autónoma bajo política (`agents/capabilities.yaml`). La autonomía efectiva es la menor entre la del riesgo de la operación (`catalog/risk.yaml`) y la máxima del modo.

## Roles
Roles humanos aprobadores (PRODUCT_OWNER, TECH_LEAD, QA_LEAD, SECURITY_OFFICER, OPERATOR) y roles ejecutores que puede asumir una persona o un agente: `catalog/roles.yaml`.

## Mapa de documentos
| Área | Documento |
|---|---|
| Catálogo normativo | `methodology/catalog/` |
| Glosario | `00-master-guide/glossary.md` |
| Ejecución por IA | `01-ai-operating-protocol/` |
| Documentación | `02-documentation-standard/` |
| Trazabilidad | `03-traceability-standard/` |
| Seguridad | `04-security-principles/` |
| Calidad | `05-quality-principles/` |
| Eficiencia LLM | `06-llm-efficiency-principles/` |
| Tareas, evidencia y aprobaciones | `07-work-standard/` |
| Evolución y operación | `08-evolution-operations/` |
| Estructura y configuración de proyectos | `09-project-setup/` |
| Gobierno | `governance/` |
