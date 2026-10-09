# Software AI Development Methodology

Metodología profesional, reutilizable y agnóstica de proveedores para desarrollar software con asistencia de IA, con su herramienta determinista `ai-dev`.

**Versión 1.3.1**, validada con un proyecto real ([MiAdmin](https://github.com/alex7506/miadmin)).

📖 **Manual de usuario:** https://alex7506.github.io/software-ai-development/ — [instalar](https://alex7506.github.io/software-ai-development/guias/instalar) · [tutorial](https://alex7506.github.io/software-ai-development/tutorial/primer-proyecto)

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
| `templates/` | `documents/`: plantillas de documentos con metadatos. `project/`: archivos base que instala `ai-dev init`. |
| `technology-profiles/` | Plantilla genérica de perfil tecnológico y un perfil de referencia (Google). |
| `adapters/` | Plantillas para AGENTS.md, Claude Code, Cursor, Copilot y Gemini CLI. |
| `cli/` | CLI determinista `ai-dev` y pruebas de integridad del estándar. |
| `docs/` | Manual de usuario (fuente del sitio web): conceptos, roles, guías, tutorial y referencia generada. |
| `governance/` | Gobierno y evolución de la metodología. |

## Uso en proyectos
Cada proyecto vive en su propio repositorio y fija la versión de la metodología en `.ai-dev/methodology.yaml`, instalada con `ai-dev init`.

```bash
ai-dev init --name "Mi Proyecto" --mode STANDARD
ai-dev status
```

Empieza por el [manual de usuario](https://alex7506.github.io/software-ai-development/).

## Convenciones
Prosa en español; claves, enums, identificadores y comandos en inglés. Archivos de datos en `.yaml`.

## Licencia
Licencia de uso: puedes usar la metodología y `ai-dev` gratis, también en proyectos comerciales, y adaptarlas para uso interno; no se permite distribuir versiones modificadas. Todo lo que crees con ellas es tuyo. Texto completo en [LICENSE](LICENSE).

© 2026 Ing. Alexander Patiño Londoño.
