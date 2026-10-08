# Trazabilidad

Trazabilidad es poder responder, para cualquier pieza del proyecto, **por qué existe** y **qué depende de ella**.

```
Requisito → Diseño → Arquitectura → Diseño técnico → Tarea → Código → Prueba → Validación → Commit → Release
```

## Cómo se registra
Cada documento declara sus relaciones en su encabezado de metadatos:

```yaml
relations:
  - type: IMPLEMENTS
    target: FR-003
  - type: DEPENDS_ON
    target: TASK-007
```

Y cada commit indica su tarea con una línea al final del mensaje:

```
Añade filtro por prioridad

Task: TASK-030
```

El trabajo de release (por ejemplo, subir la versión) usa `Release: REL-001`, y el de una solicitud de cambio sin tarea, `Change: CHANGE-001`. Los commits que solo tocan documentación de la metodología no necesitan trailer.

Con eso, la herramienta construye el grafo completo sin que nadie mantenga una matriz a mano.

## Qué detecta
- **Requisitos huérfanos**: aprobados pero sin ninguna tarea que los implemente.
- **Tareas sin origen**: trabajo que no responde a ningún requisito ni tiene justificación.
- **Referencias rotas**: relaciones hacia documentos que no existen.
- **Conflictos**: dos artefactos que se contradicen.

El resultado es un estado de integridad: `INTEGRITY_OK`, `WARNINGS`, `DEGRADED` o `BLOCKED`. Cada modo de rigor exige un mínimo para poder validar y publicar.

## Relaciones sugeridas por IA
Un agente puede proponer relaciones, pero debe indicar su confianza (de 0 a 1) y no cuentan como válidas hasta que una persona las confirme. La trazabilidad no se inventa.

## Proyectos existentes
Si adoptas la metodología en un proyecto que ya tenía código, no hace falta rastrear el pasado: la trazabilidad se exige a partir de la fecha de adopción.

## Valores exactos
Tipos de relación y estados: `methodology/catalog/states.yaml`. Norma completa: `methodology/03-traceability-standard/`.

## Siguiente
[Independencia de proveedor](independencia-de-proveedor.md)
