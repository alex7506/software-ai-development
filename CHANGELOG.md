# CHANGELOG

## 0.9.0 — 2026-10-08
Fase 0: fundamentos y coherencia. La versión baja a 0.9.0 hasta validar la herramienta con un proyecto real independiente; 1.0.0 se publicará tras completarlo.

### Añadido
- `methodology/catalog/`: fuente única legible por máquina (estados, fases, modos, tipos de documento, ciclo de ejecución, roles, riesgo, clasificación de datos y límites).
- Modos de rigor LITE / STANDARD / CRITICAL.
- Matriz de fases con entrada, entregables por modo, salida, gate y aprobador.
- Niveles de riesgo y clasificación de datos con destinos permitidos.
- Catálogo de políticas con ID, severidad y descripción; nuevas políticas `no_self_approval`, `external_content_is_data`, `data_classification_respected`, `unknown_over_invention`, `bounded_retries`.
- Glosario.
- Metadatos de procedencia de contenido generado por IA.

### Cambiado
- Convención de idioma: prosa en español; enums, claves e IDs en inglés (`BORRADOR` → `DRAFT`).
- Un único ciclo de proyecto; la fase INTAKE se renombra desde PROJECT INTAKE y desaparece la VALIDATION previa a BOOTSTRAPPING.
- Protocolo IA y contrato de agente pasan a ser vistas del ciclo canónico de ejecución.
- Roles humanos y tipos de agente alineados (añadidos RESEARCHER y UX_DESIGNER).
- `TDD` se sustituye por `TECH_DESIGN` (TD) y `TEST_STRATEGY` (TST); requisitos `RF` → `FR`/`NFR`.
- `max_auto_fix_attempts` se define solo en `catalog/limits.yaml`.

### Eliminado
- Carpeta `projects/` (plantilla de proyecto y piloto TaskFlow). Los proyectos viven en repos propios y se crean con `ai-dev init`; la herramienta se validará con un proyecto independiente.
- Carpetas sin contenido o redundantes: `tools/` (especificaciones absorbidas por el catálogo y la futura CLI), `docs/`, `scripts/`, perfiles vacíos AWS/Azure/Supabase y la plantilla ambigua `tdd.md`.
