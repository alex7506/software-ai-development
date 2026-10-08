# Gemini CLI

## Archivo
**`GEMINI.md`**: archivo de contexto que Gemini CLI carga al iniciar. Importa las reglas con `@./AGENTS.md`.

Comprueba que se cargaron con `/memory show` dentro de Gemini CLI.

## Limitaciones
Las reglas son instrucciones. Gemini CLI pide confirmación antes de ejecutar comandos de shell y modificar archivos salvo que actives la aprobación automática: no la actives en proyectos STANDARD o CRITICAL. `ai-dev approve` sigue exigiendo terminal interactiva.

## Instrucciones propias
Escríbelas debajo del bloque generado en `GEMINI.md`.
