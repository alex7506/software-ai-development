# Glosario

| Término | Definición |
|---|---|
| **Adaptador** | Archivo generado que traduce la metodología al formato que lee un agente o IDE concreto (AGENTS.md, CLAUDE.md, GEMINI.md, reglas de Cursor, instrucciones de Copilot). |
| **ADR** | Architecture Decision Record. Registro de una decisión relevante con contexto, alternativas y consecuencias. |
| **Agente** | Sistema de IA que ejecuta tareas con capacidades y permisos asignados. Puede ser de cualquier proveedor. |
| **Aprobación** | Acto humano registrado que autoriza un entregable, fase o cambio. Nunca la realiza un agente. |
| **Autorización** | Decisión ALLOW / DENY / REQUIRES_APPROVAL para ejecutar una operación concreta en un contexto concreto. |
| **Capacidad** | Lo que un agente o herramienta es técnicamente capaz de hacer. No implica permiso. |
| **Catálogo** | Archivos YAML en `methodology/catalog/` que son la fuente única de valores normativos. |
| **Clasificación de datos** | Nivel PUBLIC / INTERNAL / CONFIDENTIAL / RESTRICTED que determina a qué destinos puede enviarse un dato. |
| **Contexto mínimo suficiente** | Conjunto más pequeño de información que permite ejecutar una tarea correctamente. |
| **Definition of Done (DoD)** | Condiciones para que una tarea pase a COMPLETED. |
| **Definition of Ready (DoR)** | Condiciones para que una tarea pase a READY. |
| **Entregable** | Documento o artefacto exigido por una fase según el modo de rigor. |
| **Evidencia** | Resultado verificable (salida de pruebas, informe, commit, captura) que respalda una afirmación. |
| **FR / NFR** | Requisito funcional / no funcional. |
| **Fuente de verdad** | Documentos y archivos persistentes del proyecto; prevalecen sobre cualquier conversación. |
| **Gate** | Control que debe superarse para avanzar (CODE, BUILD, TEST, SECURITY, TRACEABILITY, VALIDATION, RELEASE). |
| **Modo de rigor** | LITE, STANDARD o CRITICAL; ajusta entregables, gates y autonomía al riesgo del proyecto. |
| **Perfil tecnológico** | Conjunto de tecnologías aprobadas para un proyecto, con justificación. No forma parte del núcleo. |
| **Permiso** | Habilitación explícita para usar una capacidad en un proyecto o tarea. |
| **Procedencia** | Metadatos que indican quién o qué generó un artefacto: `generated_by`, `model`, `model_version`, `context_ref`. |
| **TECH_DESIGN (TD)** | Diseño técnico detallado. Sustituye al antiguo "TDD", que era ambiguo. |
| **TEST_STRATEGY (TST)** | Estrategia de pruebas del proyecto. |
| **Trazabilidad** | Cadena verificable Requirement → … → Release entre artefactos. |
| **UNKNOWN** | Valor explícito para un hecho no conocido. Preferible a inventar. |
