# Estándar de Trazabilidad

## Cadena principal
Requirement → Design → Architecture → Tech Design → Task → Code → Test → Validation → Commit → Release

## Relaciones
Tipos en `catalog/states.yaml#relation_types`. Se declaran en el frontmatter del documento origen:

```yaml
relations:
  - type: IMPLEMENTS
    target: FR-001
  - type: DEPENDS_ON
    target: TASK-001A
```

Los commits se vinculan a tareas con el trailer `Task: TASK-011`.

## Integridad
INTEGRITY_OK · WARNINGS · DEGRADED · BLOCKED (`catalog/states.yaml#integrity_status`). El mínimo exigido depende del modo (`catalog/modes.yaml`).

## Reglas
- No se inventan relaciones. Las inferidas por IA declaran `confidence` (0–1) y no cuentan para INTEGRITY_OK hasta que una persona las confirme.
- Todo requisito APPROVED tiene al menos una tarea que lo implementa antes de salir de PLANNING.
