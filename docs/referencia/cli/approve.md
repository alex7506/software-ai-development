<!-- Generado por `npm run docs:gen` desde la CLI y methodology/catalog. No editar a mano. -->

# `ai-dev approve`

Registra una decisión humana sobre una fase o un documento. Requiere terminal interactiva: los agentes no aprueban.

```
ai-dev approve <objetivo> [opciones]
```

**Argumentos**

| Argumento | Descripción |
|---|---|
| `objetivo` | Fase (p. ej. DEFINITION) o ID de documento |

**Opciones**

| Opción | Descripción |
|---|---|
| `--by <nombre>` (obligatoria) | Persona que decide. |
| `--role <rol>` (obligatoria) | Rol aprobador: PRODUCT_OWNER, TECH_LEAD, QA_LEAD, SECURITY_OFFICER, OPERATOR. |
| `--reject` | Rechaza en lugar de aprobar. |
| `--request-changes` | Pide cambios en lugar de aprobar. |
| `--comment <texto>` | Comentario de la decisión. |

