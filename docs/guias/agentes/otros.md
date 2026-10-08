# Otros asistentes (AGENTS.md)

**`AGENTS.md`** es un formato abierto que leen, entre otros, OpenAI Codex, Google Jules, Aider, Zed y el propio Cursor. Si tu asistente lo soporta, no necesitas nada más.

Si tu asistente usa otro archivo de instrucciones:
1. Indícale en ese archivo que lea y siga `AGENTS.md`, o
2. Copia el contenido de `AGENTS.md` en su archivo, sabiendo que deberás repetir la copia tras cada `ai-dev adapters sync`.

Si un asistente no admite instrucciones de proyecto, entrégale el contexto de cada tarea con `ai-dev context TASK-NNN --out contexto.md`: incluye las reglas que aplican a esa tarea.
