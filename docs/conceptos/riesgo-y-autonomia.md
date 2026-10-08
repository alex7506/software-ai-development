# Riesgo y autonomía

¿Cuánto puede hacer un agente de IA sin preguntar? Depende de **qué** va a hacer, **con qué datos** y **dónde**.

## Niveles de autonomía
| Nivel | Nombre | Qué significa |
|---|---|---|
| 0 | Manual | La persona hace el trabajo; la IA no interviene |
| 1 | Asistida | La IA sugiere; la persona decide y ejecuta |
| 2 | Controlada | La IA ejecuta cada acción después de que una persona la apruebe |
| 3 | Autónoma limitada | La IA ejecuta dentro del alcance de la tarea; una persona revisa después |
| 4 | Autónoma bajo política | La IA ejecuta según reglas sin revisión acción por acción |

## Niveles de riesgo
Cada operación tiene un riesgo:

| Riesgo | Ejemplos | Qué exige |
|---|---|---|
| **LOW** | Leer código, analizar, redactar borradores | Nada; queda registrado |
| **MEDIUM** | Modificar código en una rama, generar pruebas, hacer commits locales | Revisión posterior |
| **HIGH** | Añadir dependencias, cambiar la arquitectura, subir cambios al remoto | Aprobación previa |
| **CRITICAL** | Desplegar en producción, borrar datos, tocar secretos o permisos | Aprobación previa y confirmación de una persona |

El riesgo de una operación es el **mayor** de tres factores:
- **La operación en sí**: borrar es más grave que leer.
- **Los datos implicados**: tocar datos personales es más grave que tocar textos públicos.
- **El entorno**: producción es más grave que tu máquina.

La autonomía permitida es la **menor** entre la que admite ese riesgo y la que admite el [modo de rigor](modos-de-rigor.md) del proyecto.

## Clasificación de datos
Los datos se clasifican en cuatro niveles, y cada nivel indica a qué tipo de servicio se pueden enviar:

| Nivel | Ejemplos | Se puede enviar a |
|---|---|---|
| **PUBLIC** | Documentación pública, código abierto | Cualquier servicio de IA |
| **INTERNAL** | Código propietario, documentación interna | Modelos locales o servicios de IA con contrato empresarial |
| **CONFIDENTIAL** | Datos de clientes, datos personales | Modelos locales o empresariales, y solo minimizados o anonimizados |
| **RESTRICTED** | Contraseñas, claves, datos de salud o financieros | A ningún modelo. Nunca. |

Cada proyecto declara qué proveedores concretos usa y a qué tipo pertenece cada uno. Así la regla funciona igual con cualquier proveedor.

## Valores exactos
`methodology/catalog/risk.yaml`, `methodology/catalog/data-classification.yaml` y `agents/capabilities.yaml`.

## Siguiente
[Trazabilidad](trazabilidad.md)
