# Adoptar la metodología en un proyecto existente

Si el proyecto ya tiene código, `ai-dev init` lo detecta y lo **adopta**: no toca tu código ni reorganiza carpetas, solo añade la estructura de la metodología.

## 1. Instalar
Desde la raíz del proyecto:

```bash
ai-dev init --name "Proyecto Existente" --mode STANDARD --phase DEVELOPMENT
```

- `--phase` declara en qué fase está realmente el proyecto (normalmente `DEVELOPMENT` o `EVOLUTION`). Solo se permite al adoptar.
- Queda registrada la fecha de adopción (`adopted_at`): la trazabilidad de commits se exige **desde ese día**, no hacia atrás.
- No se crea el documento de intake.

## 2. Respetar la estructura que ya tienes
Si el proyecto ya guarda sus documentos en otras carpetas (por ejemplo, ADR en `docs/adr/`), decláralo en `.ai-dev/configuration.yaml` en lugar de moverlos:

```yaml
document_folders:
  ADR: adr          # relativo a docs/
  PRD: ""           # "" = la raíz de docs/
```

Los documentos existentes se integran **añadiéndoles el encabezado de metadatos** (frontmatter) en su sitio: `document_id`, `document_type`, `status`… Así no se rompe ningún enlace.

**Formateadores:** si el proyecto usa Prettier, `init` añade a `.prettierignore` los archivos que genera `ai-dev`. Declara además el formateador en `format_command` de `.ai-dev/configuration.yaml` (por ejemplo `npx prettier --write`): la CLI lo ejecuta sobre lo que escribe (evidencia, procedencia, estado) y `approve` formatea el documento antes de fijar su huella. Sin él, formatea tus documentos **antes** de enviarlos a revisión: un cambio de formato después de aprobarlos cuenta como modificación.

## 3. Documentar lo que ya existe
Escribe el estado **real**, no el ideal. Lo desconocido se marca `UNKNOWN`.

| Qué | Cómo |
|---|---|
| Requisitos ya implementados | `docs/01-product/requirements.yaml`, con `baseline: true`: se implementaron antes de adoptar la metodología y no se les exige una tarea |
| Requisitos pendientes | En el mismo archivo, sin `baseline`, cada uno con su tarea |
| Arquitectura actual | `ai-dev new ARCHITECTURE --title "Arquitectura actual"`, enlazando las decisiones existentes |
| Decisiones ya tomadas | Un ADR por decisión relevante (o los que ya tengas, con su encabezado) |
| Stack | Declara `technology_profile` en `.ai-dev/methodology.yaml` |

Marca `baseline` **antes** de aprobar los requisitos: forma parte de lo que se aprueba.

## 4. Aprobar la documentación reconstruida
El líder técnico revisa y aprueba los documentos (`ai-dev submit` y `ai-dev approve`). Ver [Aprobar documentos y fases](aprobar.md).

## 5. Trabajar con la metodología desde hoy
Todo trabajo nuevo entra como tarea (ver [Gestionar tareas](gestionar-tareas.md)) y cada commit lleva su trailer `Task: TASK-NNN`.

```bash
ai-dev validate
ai-dev trace --git
```

## 6. Validar en la CI
Para que ningún PR rompa la metodología, añade un paso que instale la versión fijada de `ai-dev` y valide:

```yaml
      - name: Metodología (ai-dev)
        run: |
          git clone --depth 1 --branch v1.3.0 https://github.com/alex7506/software-ai-development.git /tmp/ai-dev
          (cd /tmp/ai-dev/cli && npm ci && npm run build)
          node /tmp/ai-dev/cli/dist/bin.js validate
          node /tmp/ai-dev/cli/dist/bin.js trace --git
```

Usa `fetch-depth: 0` en el checkout para que `trace --git` vea el historial.

Consulta la norma completa en `methodology/09-project-setup/project-setup.md`.
