# CHANGELOG

## 0.9.0 — 2026-10-08
Fases 0, 1 y 2: fundamentos, contenido del estándar y CLI `ai-dev`. La versión baja a 0.9.0 hasta validar la herramienta con un proyecto real independiente; 1.0.0 se publicará tras completarlo.

### Añadido (Fase 2)
- CLI `ai-dev` (TypeScript, determinista): `init` (proyectos nuevos y adopción de existentes, idempotente), `new`, `submit`, `revise`, `approve` (solo terminal interactiva), `validate`, `trace [--git]`, `status`, `context`, `doctor`, `phase check|advance|reenter` y `task new|list|ready|start|review|wait|validate|complete|block|cancel|fail|evidence|attempt|provenance`.
- Aprobaciones con huella de contenido: editar un documento aprobado invalida su aprobación.
- Gates ejecutables por proyecto (`gate_commands`), Definition of Ready y Definition of Done comprobadas al mover tareas.
- Empaquetado con la metodología incluida (`assets/`), referencia del manual generada (`docs/referencia/`) y guías de uso (`docs/guias/`).
- Esquemas: `target_hash` en aprobaciones, `phase_started_at` en el estado y `gate_commands` en la configuración.

### Añadido (Fase 1)
- Normativa: estándar de trabajo (tareas, DoR/DoD, evidencia, commits, aprobaciones), evolución y operación (cambios, incidentes, rollback, deuda), estructura y configuración de proyectos (incluida la adopción en proyectos existentes), estrategia de pruebas y controles contra prompt injection.
- `catalog/definitions.yaml`: Definition of Ready, Definition of Done y tipos de tarea.
- JSON Schemas completos (draft 2020-12) para documentos, tareas, ADR, cambios, validaciones, releases, requisitos y archivos `.ai-dev/`. Los enums se derivan del catálogo en tiempo de carga.
- Plantillas reales con metadatos y secciones propias (`templates/documents/`) y archivos base de proyecto (`templates/project/`).
- Formato común de perfiles tecnológicos; perfil Google como referencia.
- Manual de usuario: conceptos y guías por rol (`docs/`).
- Base de la CLI (`cli/`): carga del catálogo, registro de esquemas, renderizado de plantillas y pruebas de integridad del estándar; CI en GitHub Actions.

### Añadido (Fase 0)
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
