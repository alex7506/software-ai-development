# Principios de Eficiencia de LLM

No toda operación necesita LLM. Priorizar herramientas deterministas.

Costo total = modelo + herramientas + tiempo + errores + retrabajo + riesgo + mantenimiento.

Aplicar contexto mínimo suficiente, recuperación guiada por tarea/dependencias/relevancia/prioridad/versión, compresión con referencias, caché con invalidación, el modelo más pequeño capaz, escalamiento cuando sea necesario y el límite de correcciones automáticas de `catalog/limits.yaml`.

La seguridad, la calidad y la corrección tienen prioridad sobre el ahorro de tokens.
