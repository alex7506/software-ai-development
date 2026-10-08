# Tutorial: tu primer proyecto de principio a fin

Este tutorial recorre el ciclo completo de la metodología, de la idea a una versión publicada, con un proyecto pequeño en modo LITE. Está basado en el piloto real [MiAdmin](https://github.com/alex7506/miadmin) (una bóveda de contraseñas en el navegador), y la prueba automática `cli/test/tutorial.test.ts` reproduce estos mismos pasos.

**Reparto de papeles:**
- **El agente de IA** (aquí, Claude Code) redacta los documentos, crea las tareas, implementa y registra la evidencia.
- **Tú** decides y apruebas. Lo haces en **dos sesiones de revisión** de pocos minutos cada una.

**Duración aproximada:** un par de horas de trabajo del agente y unos 15 minutos tuyos.

**Requisitos:** `ai-dev` instalado (ver [Instalar](../guias/instalar.md)), Git y un asistente de IA.

---

## 1. Crear el proyecto
```bash
mkdir mi-proyecto && cd mi-proyecto
git init
ai-dev init --name "Mi Proyecto" --mode LITE --author "Claude Code"
```

`--author` es quien redacta los documentos; en este reparto, el agente. Tú aparecerás como aprobador.

`init` crea `.ai-dev/`, el primer documento (`INTAKE-001`), `requirements.yaml`, `AI-CONTEXT.md` y las instrucciones para los asistentes (`AGENTS.md`, `CLAUDE.md`…). Desde este momento, tu asistente conoce las reglas del proyecto.

## 2. Contar la idea (INTAKE)
Explícale al agente qué quieres construir, para quién y qué queda fuera. Él completa `docs/00-intake/INTAKE-001-…md` y marca como `UNKNOWN` lo que no sepas todavía. Al terminar:

```bash
ai-dev submit INTAKE-001
```

> En MiAdmin, la primera versión del INTAKE describía un SaaS multi-tenant con suscripciones. Al ver el plazo (2 días) lo redujimos a una bóveda local. Ese recorte se hace **antes** de aprobar, y queda escrito en "Fuera de alcance".

## 3. Definir y planificar
Pide al agente que prepare los entregables de las fases siguientes. En LITE son pocos:

| Fase | Entregable | Comando |
|---|---|---|
| DEFINITION | PRD y requisitos con criterios de aceptación | `ai-dev new PRD --title "…"` y `docs/01-product/requirements.yaml` |
| ARCHITECTURE | Arquitectura (y ADR para las decisiones importantes) | `ai-dev new ARCHITECTURE --title "…"`, `ai-dev new ADR --title "…"` |
| TECHNOLOGY | Perfil tecnológico | `technology_profile` en `.ai-dev/methodology.yaml` |
| PLANNING | Plan y tareas | `ai-dev new IMPLEMENTATION_PLAN --title "…"`, `ai-dev task new …` |

Una tarea se crea así:

```bash
ai-dev task new --title "Cifrado y clave maestra" \
  --implements FR-001 --implements NFR-001 \
  --criterion "Crear clave maestra de al menos 12 caracteres (FR-001 AC-1), con pruebas" \
  --depends-on TASK-001 --author "Claude Code"
```

El agente envía cada documento a revisión (`ai-dev submit <ID>`) y comprueba que todo esté en orden:

```bash
ai-dev validate     # 0 errores
ai-dev trace        # integridad de la trazabilidad
```

## 4. Primera sesión de revisión (tú)
En **tu** terminal, no en el chat del agente:

```bash
ai-dev review --by "Tu Nombre" --roles PRODUCT_OWNER,TECH_LEAD,QA_LEAD
```

Escribe tu nombre para confirmar y responde a cada elemento: `s` para aprobar, `c` para pedir cambios, `o` para omitir. La sesión aprueba los documentos, los requisitos y cada fase lista, y avanza sola. En MiAdmin fueron **15 decisiones** que llevaron el proyecto de INTAKE a **DEVELOPMENT**.

> El agente no puede ejecutar este comando: exige una terminal interactiva y Claude Code lo tiene bloqueado. Es intencionado. Aprobar es tu papel.

## 5. Desarrollo (el agente)
Por cada tarea, el agente sigue el mismo ciclo:

```bash
ai-dev task ready TASK-001        # comprueba la Definition of Ready
ai-dev task start TASK-001
ai-dev context TASK-001           # contexto mínimo: requisitos, ADR y reglas que aplican
# … implementa y hace commit con el trailer:  Task: TASK-001
ai-dev task evidence TASK-001 --criterion AC-1 --type TEST_RUN --ref "npm test — 18 passed"
ai-dev task provenance TASK-001 --generated-by claude-code --model <modelo>
ai-dev task validate TASK-001
ai-dev task complete TASK-001     # Definition of Done + gates
```

Configura antes los gates en `.ai-dev/configuration.yaml`, para que `task complete` los ejecute:

```yaml
gate_commands:
  CODE: npm run typecheck
  BUILD: npm run build
  TEST: npm test
  SECURITY: npm audit --audit-level=high
```

> En MiAdmin, el gate SECURITY rechazó la primera instalación (versiones de Vite y Vitest con vulnerabilidades críticas) antes de escribir una línea de código.

## 6. Validación y release (el agente)
Cuando todas las tareas están cerradas, el agente prepara dos documentos:

```bash
ai-dev new VALIDATION_REPORT --title "Validación v0.1.0"
ai-dev new RELEASE --title "Release v0.1.0"
```

- El **informe de validación** tiene una fila por requisito y por gate, cada una con su evidencia. Lo que no se pueda automatizar, por ejemplo la interfaz, se indica para que lo verifiques tú.
- La **release** describe su contenido y **cómo revertirla**. El rollback hay que comprobarlo de verdad: en MiAdmin se reconstruyó el commit anterior en un directorio aparte.

Ambos se envían a revisión con `ai-dev submit`.

## 7. Segunda sesión de revisión (tú)
Verifica lo que el informe te pida (en MiAdmin, probar la interfaz con `npm run dev` y datos inventados) y ejecuta de nuevo:

```bash
ai-dev review --by "Tu Nombre" --roles PRODUCT_OWNER,TECH_LEAD,QA_LEAD
```

Aprobarás el informe, la release y las fases DEVELOPMENT, VALIDATION y RELEASE. El proyecto queda en **EVOLUTION**. Después, publica la versión:

```bash
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

## 8. Y después
EVOLUTION no se cierra: es la fase de operación. Cada cambio importante entra como solicitud de cambio y vuelve a la fase que corresponda:

```bash
ai-dev new CHANGE_REQUEST --title "Sincronización entre dispositivos"
ai-dev submit CHANGE-001
# tú lo apruebas con ai-dev review
ai-dev phase reenter --change CHANGE-001
```

Una corrección sin cambio de requisitos es una tarea de tipo FIX.

---

## Lo que aprendimos con MiAdmin
- **Recortar antes de aprobar.** Es más barato ajustar el alcance en el INTAKE que a mitad del desarrollo.
- **Dos sesiones bastan.** Con `ai-dev review`, aprobar todo el ciclo te lleva unos minutos.
- **Los controles actúan solos.** El gate SECURITY bloqueó dependencias vulnerables, y la política de dependencias impidió añadir una librería no aprobada (la verificación de la interfaz quedó como prueba manual documentada).
- **Lo aprobado se respeta.** Una incógnita resuelta después de aprobar el INTAKE se registró en la configuración, sin reabrir el documento.

El registro completo de fricciones está en [notas-miadmin.md](notas-miadmin.md).
