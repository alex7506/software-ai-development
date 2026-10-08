# GitHub Copilot

## Archivo
**`.github/copilot-instructions.md`**: instrucciones de repositorio que Copilot Chat y el agente de código de Copilot añaden a cada solicitud. Contienen las reglas completas.

## Limitaciones
Las instrucciones no bloquean acciones. Si usas el agente de código de Copilot (que abre pull requests), protege la rama principal y ejecuta `ai-dev validate` y `ai-dev trace` en la CI para que un PR que incumpla la metodología no se pueda fusionar.

## Instrucciones propias
Escríbelas fuera del bloque generado, o en archivos `.github/instructions/*.instructions.md`.
