<!-- Generado por `npm run docs:gen` desde la CLI y methodology/catalog. No editar a mano. -->

# `ai-dev phase`

Comprueba, avanza o reingresa fases del ciclo.

## `ai-dev phase check`

Evalúa entregables, checks, gates y aprobación de una fase (por defecto, la actual).

```
ai-dev phase check [fase] [opciones]
```

**Argumentos**

| Argumento | Descripción |
|---|---|
| `fase` (opcional) | Fase a evaluar |

**Opciones**

| Opción | Descripción |
|---|---|
| `--json` | Salida en JSON. |

## `ai-dev phase advance`

Pasa a la siguiente fase si la actual está completa y aprobada.

```
ai-dev phase advance
```

## `ai-dev phase reenter`

Desde EVOLUTION, reingresa en la fase que indica una solicitud de cambio aprobada.

```
ai-dev phase reenter [opciones]
```

**Opciones**

| Opción | Descripción |
|---|---|
| `--change <id>` (obligatoria) | Solicitud de cambio aprobada (CHANGE-NNN). |

