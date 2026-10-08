# Notas del piloto MiAdmin

Registro de fricciones encontradas al usar la metodología y `ai-dev` en un proyecto real e independiente ([MiAdmin](https://github.com/alex7506/miadmin)). Cada entrada termina en una corrección con prueba, un cambio de la metodología o una decisión de no actuar.

| # | Fase | Fricción | Impacto | Acción |
|---|---|---|---|---|
| 1 | Planificación | Una política local no puede exigir un entregable adicional (MiAdmin necesita QUALITY_SECURITY en STANDARD); hoy la política es solo texto y `phase check` no la aplica. | Un control de seguridad depende de la memoria del equipo. | Pendiente: CHANGE para `required_deliverables` locales evaluados por `phase check`. |
| 2 | Planificación | CRITICAL exige dos aprobadores distintos: inviable para una persona sola, aunque el producto guarde credenciales. | Obliga a bajar a STANDARD y compensar con políticas locales. | Pendiente: evaluar una variante "responsable único" con revisión diferida documentada. |
| 3 | INTAKE | `validate` muestra "1 documentos, 0 requisitos" (plural fijo). | Cosmético. | Pendiente: corregir pluralización. |
| 4 | INTAKE | Para declarar `providers` hay que conocer las condiciones de privacidad del plan de IA usado, y el responsable no siempre las conoce al empezar. | Sin proveedor declarado, las reglas de clasificación de datos no indican qué puede recibir el agente. | Se registró como incógnita del INTAKE. Valorar una guía sobre cómo clasificar proveedores habituales. |
