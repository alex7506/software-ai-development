# Independencia de proveedor

La metodología debe servir igual hoy con un asistente y mañana con otro, en una nube o en otra. Para lograrlo separa tres capas:

```
┌──────────────────────────────────────────────┐
│  Núcleo: la metodología                      │  Fases, reglas, estados, documentos.
│  (igual para todos los proyectos)            │  No nombra ningún proveedor.
├──────────────────────────────────────────────┤
│  Perfiles tecnológicos                       │  "Para este proyecto usamos X, Y, Z
│  (los elige cada proyecto)                   │   porque…". Opcionales y justificados.
├──────────────────────────────────────────────┤
│  Adaptadores de asistentes                   │  AGENTS.md, CLAUDE.md, GEMINI.md,
│  (los genera la herramienta)                 │  reglas de Cursor, instrucciones de Copilot.
└──────────────────────────────────────────────┘
```

## Perfiles tecnológicos
Un perfil describe un conjunto de tecnologías que encajan bien juntas (por ejemplo, el ecosistema Google con Firebase). El proyecto:
1. Elige un perfil, uno propio o ninguno.
2. Adopta solo las piezas que necesita.
3. Registra cada elección como una decisión (ADR) con su justificación.

Elegir Google para un proyecto no hace que la metodología dependa de Google: la decisión vive en ese proyecto.

## Adaptadores
Cada asistente de IA lee sus instrucciones de un archivo distinto. En lugar de escribir las reglas varias veces, la herramienta las genera desde una única fuente:

| Asistente | Archivo |
|---|---|
| Codex, Jules, Gemini CLI y otros compatibles | `AGENTS.md` |
| Claude Code | `CLAUDE.md` y `.claude/settings.json` |
| Cursor | `.cursor/rules/ai-dev.mdc` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Gemini CLI | `GEMINI.md` |

Si cambias de asistente, el proyecto no cambia: solo se genera otro adaptador.

## Herramienta determinista
La herramienta `ai-dev` nunca llama a un modelo de lenguaje. Valida, genera estructura, calcula la trazabilidad y prepara el contexto; el razonamiento lo hace el asistente que tú elijas. Por eso funciona igual con cualquiera.
