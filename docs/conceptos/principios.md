# Principios

Los asistentes de IA escriben código rápido, pero sin un método claro producen problemas conocidos: amplían el alcance sin que nadie lo pida, olvidan decisiones de sesiones anteriores, inventan datos que no conocen, cambian tecnologías en silencio o dicen "listo" sin pruebas que lo respalden.

Esta metodología no intenta que la IA sea más lista. Pone **reglas, registros y controles** alrededor del trabajo para que esos problemas no ocurran o se detecten enseguida.

## Las ideas centrales

**El proyecto recuerda; la conversación no.**
Requisitos, decisiones, tareas y estado viven en archivos del repositorio. Cualquier persona o agente que llegue al proyecto, hoy o dentro de un año, encuentra ahí la verdad. Lo que se dijo en un chat no cuenta hasta que se escribe.

**La IA propone; las personas aprueban.**
Un agente puede analizar, escribir código, generar pruebas y redactar documentos. Nunca aprueba: ni un documento, ni una fase, ni un cambio. Además, en proyectos de cierto nivel, quien produce algo no puede ser quien lo apruebe.

**Poder hacer algo no es tener permiso para hacerlo.**
Que un agente sea *capaz* de desplegar en producción no significa que *pueda* hacerlo en este proyecto, ni que *deba* hacerlo en esta tarea. Capacidad, permiso y autorización son tres cosas distintas.

**Todo se puede rastrear.**
Cada línea de código se puede seguir hasta la tarea que la pidió, y cada tarea hasta el requisito que la justifica. Si algo no tiene origen, sobra o falta un requisito.

**Sin evidencia no hay éxito.**
"Funciona" significa que hay una prueba, un informe o un resultado verificable que lo demuestra. Nunca se desactiva una prueba para que pase.

**Lo desconocido se declara.**
Si falta un dato, se marca `UNKNOWN` o se pregunta. Inventarlo es peor que no saberlo.

**Primero lo determinista.**
Si una tarea se puede resolver con una herramienta exacta (validar un archivo, contar dependencias, buscar un texto), no se usa un modelo de lenguaje. Es más barato, más rápido y no se equivoca.

**La seguridad no se negocia por ahorro.**
Nunca se elimina un control de seguridad para gastar menos tokens o terminar antes.

## Independiente de cualquier proveedor
La metodología no depende de ningún modelo, asistente, editor ni nube. Las tecnologías concretas entran solo de dos formas:
- **Perfiles tecnológicos**: conjuntos de tecnologías que un proyecto puede elegir, con justificación. Ver [Independencia de proveedor](independencia-de-proveedor.md).
- **Adaptadores**: archivos que traducen las reglas al formato que lee cada asistente (AGENTS.md, CLAUDE.md, GEMINI.md…).

## Siguiente
[Ciclo y fases](ciclo-y-fases.md)
