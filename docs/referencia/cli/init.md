<!-- Generado por `npm run docs:gen` desde la CLI y methodology/catalog. No editar a mano. -->

# `ai-dev init`

Instala la metodología en el directorio actual (proyecto nuevo o existente). No sobrescribe archivos.

```
ai-dev init [dir] [opciones]
```

**Argumentos**

| Argumento | Descripción |
|---|---|
| `dir` (opcional) | Directorio del proyecto Por defecto: `.`. |

**Opciones**

| Opción | Descripción |
|---|---|
| `--name <nombre>` (obligatoria) | Nombre del proyecto. |
| `--id <id>` | Identificador en minúsculas con guiones (por defecto, derivado del nombre). |
| `--mode <modo>` | Modo de rigor. Valores: `LITE`, `STANDARD`, `CRITICAL`. Por defecto: `STANDARD`. |
| `--profile <perfil>` | Perfil tecnológico (p. ej. google). |
| `--author <nombre>` | Autor de los documentos iniciales (por defecto, git user.name). |
| `--phase <fase>` | Fase inicial al adoptar un proyecto existente. |
| `--adapters <lista>` | Adaptadores separados por comas: agents-md, claude-code, cursor, copilot, gemini (por defecto, todos). |

