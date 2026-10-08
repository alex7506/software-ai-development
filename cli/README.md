# `ai-dev` — CLI de Software AI Development

CLI determinista (nunca llama a un LLM) que instala la metodología en un proyecto, valida sus documentos, calcula la trazabilidad y gobierna fases, tareas y aprobaciones.

Uso: ver el [manual](../docs/index.md), en especial [Instalar](../docs/guias/instalar.md) y la [referencia de comandos](../docs/referencia/cli/README.md).

## Desarrollo
```bash
npm ci
npm run dev -- status      # ejecuta la CLI desde el código fuente
npm test                   # pruebas de integridad del estándar y de extremo a extremo
npm run typecheck
npm run build              # copia la metodología en assets/ y compila dist/bin.js
npm run docs:gen           # regenera docs/referencia (la CI falla si está desactualizada)
```

## Estructura
| Ruta | Contenido |
|---|---|
| `src/bin.ts` | Punto de entrada: conecta la CLI con la terminal real. |
| `src/cli.ts` | Definición de comandos (commander). Recibe un entorno inyectable para probarla sin terminal. |
| `src/core/catalog.ts` | Carga `methodology/catalog/` y construye los enums de los esquemas. |
| `src/core/schema.ts` | Registro de JSON Schemas (Ajv 2020-12). |
| `src/core/project.ts` | Proyecto: `.ai-dev/`, documentos, requisitos. |
| `src/core/validate.ts`, `trace.ts`, `phases.ts`, `tasks.ts`, `approvals.ts`, `context.ts` | Motores de validación, trazabilidad, fases, tareas, aprobaciones y contexto. |
| `src/core/scaffold.ts` | `ai-dev init`. |
| `src/docs/reference.ts` | Generador de `docs/referencia/`. |
| `scripts/` | Copia de assets y generación de documentación. |
| `test/` | `standard.test.ts` (integridad del estándar), `cli.test.ts` (extremo a extremo), `docs.test.ts` (manual). |

## Metodología empaquetada
`npm run build` copia `methodology/catalog`, `schemas`, `templates`, `agents`, `technology-profiles` y `VERSION` en `assets/`. Instalada, la CLI usa esa copia; dentro del repositorio (desarrollo o `npm link`) usa la metodología viva.
