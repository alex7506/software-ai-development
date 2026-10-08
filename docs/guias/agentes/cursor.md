# Cursor

## Archivo
**`.cursor/rules/ai-dev.mdc`**: regla de proyecto con `alwaysApply: true`, así se incluye en todas las conversaciones del agente de Cursor. Contiene las reglas completas (Cursor no importa otros archivos desde una regla).

Cursor también lee `AGENTS.md` de forma nativa; tener ambos no duplica nada que cambie el comportamiento.

## Limitaciones
Cursor no tiene un mecanismo de permisos equivalente al de Claude Code en el repositorio: las reglas son instrucciones. La protección efectiva la dan `ai-dev approve` (que exige terminal interactiva) y `ai-dev validate`. Revisa los cambios del agente antes de aceptarlos.

## Instrucciones propias
Crea otras reglas en `.cursor/rules/` (por ejemplo, `estilo.mdc`). No edites `ai-dev.mdc` dentro del bloque generado.
