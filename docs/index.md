---
layout: home
title: Manual de usuario
hero:
  name: Software AI Development
  text: Desarrolla con IA. Decide tú.
  tagline: Una metodología y una herramienta determinista, ai-dev, que funcionan con cualquier asistente de IA, lenguaje y nube.
  image:
    src: /logo.svg
    alt: Software AI Development
  actions:
    - theme: brand
      text: Empezar el tutorial
      link: /tutorial/primer-proyecto
    - theme: alt
      text: Instalar ai-dev
      link: /guias/instalar
    - theme: alt
      text: Ver el ejemplo MiAdmin
      link: https://github.com/alex7506/miadmin
features:
  - icon: 🧭
    title: Un ciclo claro, de la idea al release
    details: Doce fases con entregables, controles y aprobaciones definidos. El modo de rigor (LITE, STANDARD o CRITICAL) ajusta cuánto exige cada proyecto.
    link: /conceptos/ciclo-y-fases
    linkText: Ciclo y fases
  - icon: ✋
    title: La IA propone, tú apruebas
    details: Ningún agente aprueba su propio trabajo. Tú decides en sesiones de revisión de pocos minutos, y lo aprobado queda protegido contra cambios.
    link: /guias/aprobar
    linkText: Aprobar
  - icon: 🔗
    title: Todo es trazable
    details: Cada línea de código se puede seguir hasta la tarea y el requisito que la justifican. ai-dev detecta huecos y referencias rotas.
    link: /conceptos/trazabilidad
    linkText: Trazabilidad
  - icon: 🛡️
    title: Seguridad y datos bajo control
    details: Riesgo por operación, clasificación de datos por proveedor de IA, gates de calidad y seguridad, y defensa contra la inyección de instrucciones.
    link: /conceptos/riesgo-y-autonomia
    linkText: Riesgo y autonomía
  - icon: 🤖
    title: Funciona con tu asistente
    details: Genera las instrucciones para Claude Code, Cursor, GitHub Copilot, Gemini CLI y cualquier herramienta compatible con AGENTS.md.
    link: /guias/agentes/
    linkText: Asistentes de IA
  - icon: ⚙️
    title: Herramienta determinista
    details: ai-dev nunca llama a un modelo de lenguaje. Valida, traza, gobierna fases y tareas y prepara el contexto que necesita tu agente.
    link: /referencia/cli/
    linkText: Comandos
---

## Cómo está organizado este manual

| Sección | Para qué sirve |
|---|---|
| [Tutorial](tutorial/) | Aprender haciendo: un proyecto completo de principio a fin, basado en un caso real |
| [Guías](guias/) | Resolver tareas concretas: instalar, iniciar un proyecto, gestionar tareas, aprobar, configurar asistentes de IA |
| [Conceptos](conceptos/) | Entender cómo funciona la metodología y por qué |
| [Roles](roles/) | Saber qué te toca hacer según tu papel en el proyecto |
| [Referencia](referencia/) | Consultar comandos, estados, fases y plantillas exactos (generada automáticamente) |

## Por dónde empezar
1. Lee [Principios](conceptos/principios.md) para entender la idea general.
2. Lee [Ciclo y fases](conceptos/ciclo-y-fases.md) y [Modos de rigor](conceptos/modos-de-rigor.md).
3. Busca tu papel en [Roles](roles/).
4. Instala la herramienta: [Instalar](guias/instalar.md).
5. Sigue el [tutorial](tutorial/primer-proyecto.md) con tu primer proyecto.
