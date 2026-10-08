# Adaptadores

Traducen las reglas de la metodología al archivo de instrucciones que lee cada asistente de IA. Los genera `ai-dev adapters sync` (y `ai-dev init`) en cada proyecto.

| Archivo | Contenido |
|---|---|
| `registry.yaml` | Adaptadores disponibles, sus archivos y el adaptador base (`agents-md`). |
| `core.md` | Texto común de reglas. Se rellena con el catálogo y la configuración del proyecto. |
| `<adaptador>/…` | Plantilla de cada archivo destino; `{{block}}` marca dónde va el bloque generado. |
| `<adaptador>/block.md` | Bloque propio del adaptador, cuando no replica `core.md` sino que importa `AGENTS.md`. |
| `claude-code/settings.json` | Permisos de Claude Code; se fusionan con los del proyecto sin quitar nada. |

Para añadir un asistente: crea su carpeta con la plantilla, regístralo en `registry.yaml` y añade su guía en `docs/guias/agentes/`. Las pruebas de `cli/test/standard.test.ts` comprueban que el registro y las plantillas son coherentes.

Guía de uso: [Trabajar con asistentes de IA](../docs/guias/agentes/README.md).
