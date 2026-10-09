# Iniciar un proyecto

Cada proyecto vive en **su propio repositorio**. La metodología se instala dentro, sin mezclarse con ella.

## 1. Crear la carpeta y el repositorio
```bash
mkdir mi-proyecto && cd mi-proyecto
git init
```

## 2. Instalar la metodología
```bash
ai-dev init --name "Mi Proyecto" --mode STANDARD
```

| Opción | Para qué |
|---|---|
| `--mode` | `LITE`, `STANDARD` (por defecto) o `CRITICAL`. Ver [Modos de rigor](../conceptos/modos-de-rigor.md). |
| `--profile` | Perfil tecnológico, si ya lo sabes (p. ej. `google`). Se puede decidir después, en la fase TECHNOLOGY. |
| `--author` | Tu nombre. Por defecto se toma de `git config user.name`. |
| `--id` | Identificador del proyecto. Por defecto se deriva del nombre. |
| `--adapters` | Asistentes de IA para los que generar instrucciones (por defecto, todos). Ver [Trabajar con asistentes de IA](agentes/). |

`init` crea:

```
.ai-dev/                  configuración, estado y aprobaciones
docs/00-intake/INTAKE-001-…md   tu primer documento
docs/01-product/requirements.yaml
AI-CONTEXT.md             resumen para los agentes de IA
.gitignore                con .env excluido
AGENTS.md, CLAUDE.md, GEMINI.md, .cursor/, .github/   instrucciones para cada asistente de IA
```

Si lo vuelves a ejecutar, no sobrescribe nada: solo crea lo que falte.

## 3. Configurar el proyecto
Abre `.ai-dev/configuration.yaml` y completa:
- **features**: si el producto tiene interfaz, API, datos persistentes o IA como funcionalidad. Decide qué documentos se exigen.
- **providers** y **agents**: qué asistentes de IA vas a usar y con qué permisos (ver [Riesgo y autonomía](../conceptos/riesgo-y-autonomia.md)).
- **gate_commands**: los comandos que verifican calidad, por ejemplo `TEST: npm test`. `ai-dev task complete` los ejecuta.
- **format_command** (opcional): el formateador del proyecto, por ejemplo `npx prettier --write`. La CLI lo ejecuta sobre los archivos que escribe (tareas, estado, documentos nuevos) para que el gate de formato no falle por su estilo.

Después ejecuta `ai-dev adapters sync` para que las instrucciones de los asistentes reflejen los cambios.

## 4. Primera fase: INTAKE
Completa `docs/00-intake/INTAKE-001-…md` con el problema, el objetivo y el alcance. Después:

```bash
ai-dev validate          # sin errores
ai-dev submit INTAKE-001 # lo envía a revisión
```

El responsable de producto lo aprueba desde su terminal (ver [Aprobar documentos y fases](aprobar.md)) y luego aprueba la fase:

```bash
ai-dev approve INTAKE-001 --by "Ana Pérez" --role PRODUCT_OWNER
ai-dev approve INTAKE --by "Ana Pérez" --role PRODUCT_OWNER
ai-dev phase advance
```

## 5. Saber siempre qué falta
```bash
ai-dev status        # fase actual, tareas y lo que falta para cerrar la fase
ai-dev phase check   # detalle de entregables, comprobaciones, gates y aprobación
```

Para crear los documentos de cada fase:
```bash
ai-dev new PRD --title "Gestor de tareas"
ai-dev new ADR --title "Base de datos documental"
```

La lista completa de tipos está en la [referencia](../referencia/catalogo/tipos-de-documento.md).
