<!-- Generado por `npm run docs:gen` desde la CLI y methodology/catalog. No editar a mano. -->

# Modos de rigor

Fuente: `methodology/catalog/modes.yaml`.

| | LITE | STANDARD | CRITICAL |
|---|---|---|---|
| **Para qué** | Prototipos, herramientas internas y proyectos personales de bajo riesgo. | Productos en producción con usuarios reales. | Salud, finanzas, datos personales sensibles, infraestructura crítica o entornos regulados. |
| **Aprobaciones** | Una persona responsable puede producir supervisando a la IA y aprobar todas las fases. | Aprobación humana por fase; quien aprueba no es el agente que produjo el entregable. | Doble aprobación humana en ARCHITECTURE, TECHNOLOGY y RELEASE; aprobador de seguridad obligatorio. |
| **Separación de funciones** | No | Sí | Sí |
| **Trazabilidad mínima** | `WARNINGS` | `INTEGRITY_OK` | `INTEGRITY_OK` |
| **Gates** | CODE, BUILD, TEST, SECURITY | CODE, BUILD, TEST, SECURITY, TRACEABILITY, VALIDATION, RELEASE | CODE, BUILD, TEST, SECURITY, TRACEABILITY, VALIDATION, RELEASE |
| **Autonomía máxima** | 3 | 3 | 2 |
| **Doble aprobación** | — | — | ARCHITECTURE, TECHNOLOGY, RELEASE |
