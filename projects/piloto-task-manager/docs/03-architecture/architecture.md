# Architecture — TaskFlow V1.0

Arquitectura web centralizada de baja complejidad.

Capas: Presentation, Application, Authentication, Authorization, Data.

Entidades: USER 1:N TASK.

No microservicios, event bus, Kubernetes, múltiples bases de datos ni caché especializado sin una necesidad futura aprobada.

Seguridad: identidad → autenticación → autorización → validación → acceso a datos.
