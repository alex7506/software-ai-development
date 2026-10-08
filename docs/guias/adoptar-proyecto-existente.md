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

## 2. Documentar lo que ya existe
Escribe el estado **real**, no el ideal. Lo desconocido se marca `UNKNOWN`.

| Qué | Cómo |
|---|---|
| Requisitos observados | `docs/01-product/requirements.yaml`, con estado `APPROVED` si el producto ya los cumple y alguien responsable lo confirma |
| Arquitectura actual | `ai-dev new ARCHITECTURE --title "Arquitectura actual"` |
| Decisiones ya tomadas | Un ADR por decisión relevante: `ai-dev new ADR --title "..."` |
| Stack | Declara `technology_profile` en `.ai-dev/methodology.yaml` |

## 3. Aprobar la documentación reconstruida
El líder técnico revisa y aprueba los documentos (`ai-dev submit` y `ai-dev approve`). Ver [Aprobar documentos y fases](aprobar.md).

## 4. Trabajar con la metodología desde hoy
Todo trabajo nuevo entra como tarea (ver [Gestionar tareas](gestionar-tareas.md)) y cada commit lleva su trailer `Task: TASK-NNN`.

```bash
ai-dev validate
ai-dev trace --git
```

Consulta la norma completa en `methodology/09-project-setup/project-setup.md`.
