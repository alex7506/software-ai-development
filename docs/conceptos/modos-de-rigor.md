# Modos de rigor

No es lo mismo un prototipo de fin de semana que una aplicación de pagos. Exigirles lo mismo hace que el primero se abandone por burocracia o que el segundo se construya sin controles suficientes. Por eso cada proyecto elige un **modo de rigor**.

| | LITE | STANDARD | CRITICAL |
|---|---|---|---|
| **Para qué** | Prototipos, herramientas internas, proyectos personales | Productos en producción con usuarios reales | Salud, finanzas, datos sensibles, entornos regulados |
| **Documentos** | Los esenciales: ficha de ingreso, PRD, requisitos, arquitectura breve, perfil tecnológico, plan, tareas, validación y release | Ciclo completo | Ciclo completo más plan específico de calidad y seguridad |
| **Quién aprueba** | Una persona responsable puede aprobarlo todo | Aprobación por fase; quien produce no aprueba | Doble aprobación en arquitectura, tecnología y release; aprobador de seguridad obligatorio |
| **Trazabilidad mínima** | Se toleran advertencias | Completa | Completa |
| **Autonomía máxima de la IA** | Autónoma limitada (3) | Autónoma limitada (3) | Controlada (2) |

## Cómo elegir
Hazte estas preguntas:
1. ¿Lo usarán personas ajenas al equipo? Si la respuesta es sí, al menos **STANDARD**.
2. ¿Maneja dinero, salud, datos personales sensibles o está sujeto a normativa? Si la respuesta es sí, **CRITICAL**.
3. ¿Es un experimento que podrías tirar mañana sin consecuencias? Entonces **LITE**.

En caso de duda, elige el modo más alto: bajar de modo es fácil, pero reconstruir controles que no se aplicaron es costoso.

## Si trabajas solo
CRITICAL exige dos personas distintas en arquitectura, tecnología y release: es intencionado, porque un producto crítico no debería depender de una sola mirada. Si eres el único responsable de un producto sensible, usa **STANDARD** y refuerza lo que necesites:

- **Entregables adicionales:** exige, por ejemplo, el plan de calidad y seguridad en STANDARD.
  ```yaml
  # .ai-dev/configuration.yaml
  additional_deliverables:
    - phase: PLANNING
      type: QUALITY_SECURITY
      reason: Guardamos credenciales de terceros.
  ```
- **Políticas locales** en `.ai-dev/policies.yaml` (cifrado obligatorio, datos ficticios en desarrollo…).

## Cambiar de modo
El modo se fija al iniciar el proyecto. Mientras no haya ninguna aprobación, se puede corregir con `ai-dev mode <MODO> --reason "..."`. Después, forma parte de lo aprobado: un prototipo LITE que se convierte en producto pasa a STANDARD mediante una **solicitud de cambio**, y se completan los documentos que falten antes de seguir.

## Valores exactos
`methodology/catalog/modes.yaml`.

## Siguiente
[Riesgo y autonomía](riesgo-y-autonomia.md)
