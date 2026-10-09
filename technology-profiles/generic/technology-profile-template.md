---
profile_id: <id-en-minusculas>
name: <Nombre del perfil>
status: DRAFT            # DRAFT | REFERENCE
methodology_version: 1.2.3
---

# Perfil tecnológico — <Nombre>

> Un perfil describe tecnologías que un proyecto **puede** adoptar con justificación. No forma parte del núcleo de la metodología ni se aplica automáticamente. Un proyecto lo declara en `.ai-dev/methodology.yaml#technology_profile` y registra cada elección como ADR.

## Reglas
- Cada tecnología tiene justificación.
- No se agregan servicios por moda o disponibilidad.
- Cambios tecnológicos relevantes requieren análisis de impacto, ADR y aprobación.
- El perfil se adapta a cada proyecto: lo que no se necesita, no se usa.

## Capas
| Capa | Tecnología | Cuándo usarla | Alternativa dentro del perfil |
|---|---|---|---|
| Frontend |  |  |  |
| Backend |  |  |  |
| Autenticación |  |  |  |
| Autorización |  |  |  |
| Datos |  |  |  |
| Despliegue |  |  |  |
| Observabilidad |  |  |  |
| IA (si `uses_ai_in_product`) |  |  |  |

## Clasificación de datos
<!-- Qué tipos de destino (catalog/data-classification.yaml) representan los servicios del perfil
     y qué clasificación máxima admite cada uno. -->

## Seguridad
<!-- Controles propios del ecosistema: gestión de secretos, reglas de acceso, aislamiento de entornos. -->

## Pruebas y entorno local
<!-- Emuladores o herramientas para probar sin tocar servicios reales. -->

## Riesgos y dependencia del proveedor
<!-- Puntos de acoplamiento y cómo mitigarlos. -->
