# Estructura y Configuración de Proyectos

Cada proyecto vive en **su propio repositorio** y fija la versión de la metodología que usa. La metodología nunca contiene proyectos.

## Estructura de un proyecto
```
<proyecto>/
├── .ai-dev/
│   ├── methodology.yaml     versión fijada, modo de rigor y perfil tecnológico
│   ├── configuration.yaml   características del producto, proveedores y límites locales
│   ├── policies.yaml        políticas locales (solo más restrictivas)
│   ├── state.yaml           fase, estado y tarea actual
│   └── approvals.yaml       registro de aprobaciones humanas
├── docs/                    documentos según catalog/document-types.yaml
│   └── 01-product/requirements.yaml
├── AI-CONTEXT.md            resumen vivo para agentes (máx. catalog/limits.yaml#max_ai_context_md_lines)
├── AGENTS.md, CLAUDE.md…    adaptadores generados
└── <código del producto>
```

Esquemas de cada archivo de `.ai-dev/`: `schemas/ai-dev-*.schema.yaml`.

Un proyecto puede exigir entregables además de los de su modo con `additional_deliverables` en `configuration.yaml` (por ejemplo, QUALITY_SECURITY en STANDARD cuando trabaja una sola persona con datos sensibles). `ai-dev phase check` los aplica igual que los del modo.

## AI-CONTEXT.md
Resumen breve y actualizado de lo que un agente necesita al empezar: propósito, fase actual, stack aprobado, alcance y fuera de alcance, reglas locales y dónde está cada fuente de verdad. No duplica documentos: los referencia. Se actualiza al cerrar cada tarea que cambie su contenido.

## Proyecto nuevo
1. `ai-dev init` crea `.ai-dev/`, la estructura `docs/` según el modo, `AI-CONTEXT.md` y los adaptadores.
2. El proyecto empieza en INTAKE con estado ACTIVE.
3. Se avanza fase a fase según `catalog/phases.yaml`.

## Adopción en un proyecto existente (brownfield)
1. **Inventario**: identificar qué ya existe (código, documentación, decisiones, pruebas, despliegue) sin modificar nada.
2. **Instalación**: `ai-dev init` detecta el proyecto existente; no sobrescribe archivos ni reorganiza el código.
3. **Reconstrucción mínima**: documentar el estado real como DRAFT — requisitos observados, arquitectura actual y decisiones ya tomadas como ADR con estado ACCEPTED y fecha original si se conoce. Lo desconocido se marca UNKNOWN.
4. **Fase de entrada**: el proyecto se declara en la fase que refleje su realidad (normalmente DEVELOPMENT o EVOLUTION), con aprobación del TECH_LEAD sobre la documentación reconstruida.
5. **Trazabilidad progresiva**: el código previo no se traza retroactivamente; la trazabilidad completa se exige a partir de la adopción. `ai-dev trace` ignora commits anteriores a `adopted_at`.

## Actualización de la versión de la metodología
Los proyectos no se actualizan automáticamente. Actualizar la versión fijada es un CHANGE_REQUEST del proyecto: se revisa el CHANGELOG de la metodología, se aplica la nueva versión, se regeneran los adaptadores y se ejecuta `ai-dev validate`.

La CLI aplica siempre la metodología de su propia versión: usa una CLI de la misma versión que fija el proyecto. Si no coinciden, `ai-dev validate` y `ai-dev doctor` lo avisan. Las aprobaciones registradas con versiones anteriores siguen siendo válidas.
