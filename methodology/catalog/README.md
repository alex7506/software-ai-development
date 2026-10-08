# Catálogo de la metodología

Fuente única de verdad **legible por máquina**. La normativa (`methodology/0x-*`), los esquemas (`schemas/`), la CLI (`cli/`) y los adaptadores (`adapters/`) referencian estos archivos; ningún valor definido aquí debe repetirse en otro lugar.

| Archivo | Contenido |
|---|---|
| `states.yaml` | Todos los enums de estado (documento, requisito, tarea, proyecto, validación, integridad, salida de agente, autorización). |
| `phases.yaml` | Ciclo canónico y matriz de fases: entrada, entregables, salida, gate y aprobador. |
| `modes.yaml` | Modos de rigor LITE / STANDARD / CRITICAL. |
| `document-types.yaml` | Tipos de documento, prefijos de ID, plantilla y carpeta canónica. |
| `lifecycle.yaml` | Ciclo de ejecución canónico y su mapeo con el protocolo IA y el contrato de agente. |
| `roles.yaml` | Roles humanos y tipos de agente alineados. |
| `risk.yaml` | Niveles de riesgo, autonomía máxima y aprobación requerida. |
| `data-classification.yaml` | Clasificación de datos y destinos permitidos. |
| `limits.yaml` | Límites operativos numéricos. |

## Convenciones
- Prosa en español. Claves, enums, identificadores y comandos en inglés (`UPPER_SNAKE_CASE` para enums, `snake_case` para claves).
- Extensión `.yaml` (nunca `.yml`), YAML 1.2. Valores que puedan interpretarse como número o booleano van entre comillas.
- Cada archivo declara `version`, que coincide con `VERSION` de la metodología.
