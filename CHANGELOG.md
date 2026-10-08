# CHANGELOG

## 1.0.0 — 2026-10-08
Primera versión estable. La metodología y `ai-dev` se validaron con un proyecto real e independiente (MiAdmin) que recorrió el ciclo completo hasta una release; esta versión resuelve todas las fricciones que dejó el piloto.

### Añadido
- `additional_deliverables` en `.ai-dev/configuration.yaml`: el proyecto puede exigir entregables además de los de su modo (p. ej. QUALITY_SECURITY en STANDARD).
- Tipo de destino `consumer_llm_no_training` para planes individuales con el entrenamiento desactivado (hasta datos INTERNAL), y guía para clasificar proveedores de IA.
- `ai-dev mode <MODO> --reason`: cambio de modo permitido solo antes de la primera aprobación.
- Sección "Plazo y criterio de recorte" en la plantilla de intake.
- Auditoría de dependencias (`npm audit --audit-level=high`) en la CI de la CLI.

### Cambiado
- `trace --git` no cuenta como commits sin tarea los que solo tocan documentación y configuración de la metodología o del repositorio.
- `released_at` deja de formar parte de la huella de aprobación: se puede fijar la fecha de publicación después de aprobar la release. Las aprobaciones registradas con la 0.9.0 siguen siendo válidas.
- Herramientas de la CLI actualizadas (Vitest 5, tsup 8.5, tsx 4.23, TypeScript 5.9) para eliminar vulnerabilidades altas y críticas.
- Documentado: un responsable único usa STANDARD con entregables adicionales en lugar de CRITICAL; los documentos aprobados no se reabren para cerrar incógnitas resueltas después; la CLI aplica su propia versión de la metodología.

## 0.9.0 — 2026-10-08
Fases 0 a 4: fundamentos, contenido del estándar, CLI `ai-dev`, adaptadores de asistentes de IA y piloto MiAdmin. La versión baja a 0.9.0 hasta validar la herramienta con un proyecto real independiente; 1.0.0 se publicará tras completarlo.

### Añadido (Fase 4)
- Piloto real e independiente: MiAdmin (bóveda en el navegador, modo LITE) recorrió el ciclo completo hasta la release v0.1.0.
- `ai-dev approve REQUIREMENTS`: aprobación humana de requisitos con huella del contenido aprobado; `validate` y `phase check` la exigen.
- `ai-dev review`: sesión interactiva de aprobación que avanza fases, bloqueada para agentes.
- Tutorial del manual (`docs/tutorial/primer-proyecto.md`) reproducido por una prueba de extremo a extremo, y registro de fricciones del piloto.

### Corregido (Fase 4)
- Los requisitos podían marcarse como aprobados editando el YAML, sin decisión humana.
- `review` ofrecía los documentos en orden de carpeta en lugar del orden de las fases.
- `status` pedía aprobar EVOLUTION, que es la fase final.
- Pluralización en la salida de `validate`.

### Añadido (Fase 3)
- Adaptadores para AGENTS.md (base), Claude Code, Cursor, GitHub Copilot y Gemini CLI, generados desde una sola fuente (`adapters/core.md`) con el catálogo y la configuración del proyecto.
- `ai-dev adapters sync|status` e integración en `init`, `validate`, `doctor` y el check `adapters_generated` de BOOTSTRAPPING.
- Bloque gestionado entre marcadores: el texto propio fuera del bloque se conserva y las ediciones dentro del bloque se detectan y no se sobrescriben sin `--force`.
- Claude Code: permisos que bloquean `ai-dev approve`, la edición de `approvals.yaml` y `state.yaml` y la lectura de `.env`, fusionados con los existentes.
- Guías por asistente (`docs/guias/agentes/`).

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
