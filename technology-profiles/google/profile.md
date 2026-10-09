---
profile_id: google
name: Ecosistema Google (Firebase)
status: REFERENCE
methodology_version: 1.2.0
---

# Perfil tecnológico — Ecosistema Google (Firebase)

> Perfil de referencia, no obligatorio. Sirve como ejemplo del formato y como punto de partida para proyectos web que elijan este ecosistema. Cada elección se confirma con un ADR en el proyecto.

## Reglas
- No se incorporan servicios de Google automáticamente; solo los que exija un requisito.
- Gemini no se convierte en funcionalidad del producto sin un requisito aprobado (`uses_ai_in_product`).
- Cloud Functions solo cuando exista una necesidad justificada que no cubra el backend de Next.js.

## Capas
| Capa | Tecnología | Cuándo usarla | Alternativa dentro del perfil |
|---|---|---|---|
| Frontend | Next.js | Aplicaciones web con SSR o rutas protegidas | — |
| Backend | Next.js (route handlers / server actions) | Lógica de servidor ligada a la web | Cloud Functions for Firebase |
| Autenticación | Firebase Authentication | Usuarios finales con email, Google u otros proveedores | — |
| Autorización | Firebase Security Rules | Acceso a datos por usuario o rol | Verificación en servidor con Admin SDK |
| Datos | Cloud Firestore | Documentos por usuario, consultas simples | Cloud SQL si hay relaciones complejas (requiere ADR) |
| Despliegue | Firebase App Hosting | Next.js con SSR | Firebase Hosting para sitios estáticos |
| Observabilidad | Cloud Logging, Firebase Crashlytics | Siempre en producción | — |
| IA | Gemini API / Vertex AI | Solo si `uses_ai_in_product` | — |

## Clasificación de datos
| Servicio | Tipo de destino | Clasificación máxima sugerida |
|---|---|---|
| Firestore, Authentication | third_party_tool | CONFIDENTIAL (con reglas de acceso y región definida) |
| Vertex AI (proyecto propio, sin entrenamiento con datos) | enterprise_llm | CONFIDENTIAL |
| Gemini API de consumo | public_llm | PUBLIC |

## Seguridad
- Security Rules versionadas en el repositorio y cubiertas por pruebas con el emulador.
- Secretos en Secret Manager o variables de App Hosting; nunca en el código.
- Proyectos Firebase separados por entorno (desarrollo, staging, producción).

## Pruebas y entorno local
Firebase Emulator Suite para Authentication, Firestore y Functions: las pruebas de integración y de reglas nunca usan el proyecto de producción.

## Riesgos y dependencia del proveedor
- Firestore condiciona el modelo de datos (sin joins). Mitigación: encapsular el acceso a datos en una capa propia.
- Las reglas de seguridad son específicas de Firebase. Mitigación: pruebas automatizadas que documenten cada regla.
