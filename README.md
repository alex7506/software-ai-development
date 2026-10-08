# Software AI Development Methodology

Metodología profesional, reutilizable y agnóstica de proveedores para desarrollar software con asistencia de IA.

## Principio central
La metodología define **cómo** se desarrolla software; no depende de OpenAI, Anthropic, Google, Microsoft, AWS, Azure, un LLM, IDE, agente, framework o nube concretos. Las tecnologías concretas entran como perfiles tecnológicos y adaptadores.

## Ciclo
INTAKE → DISCOVERY → DEFINITION → DESIGN → ARCHITECTURE → TECHNOLOGY → PLANNING → BOOTSTRAPPING → DEVELOPMENT → VALIDATION → RELEASE → EVOLUTION

## Estructura
| Carpeta | Contenido |
|---|---|
| `methodology/` | Normativa (prosa) y `catalog/`, la fuente única de valores normativos en YAML. |
| `agents/` | Capacidades, políticas, contrato y registro de agentes. |
| `schemas/` | JSON Schemas para validar documentos y configuración. |
| `templates/` | Plantillas de documentos con metadatos. |
| `technology-profiles/` | Plantilla genérica de perfil tecnológico y un perfil de referencia (Google). |
| `adapters/` | Plantillas para AGENTS.md, Claude Code, Cursor, Copilot y Gemini CLI. |
| `cli/` | CLI determinista `ai-dev` (en desarrollo). |
| `governance/` | Gobierno y evolución de la metodología. |

## Uso en proyectos
Cada proyecto vive en su propio repositorio y fija la versión de la metodología en `.ai-dev/methodology.yaml`, instalada con `ai-dev init`.

## Convenciones
Prosa en español; claves, enums, identificadores y comandos en inglés. Archivos de datos en `.yaml`.
