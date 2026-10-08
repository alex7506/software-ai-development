# PRD — TaskFlow V1.0

## Funcionalidades
RF-001 Registro · RF-002 Login · RF-003 Logout · RF-004 Crear tarea · RF-005 Consultar · RF-006 Editar · RF-007 Eliminar · RF-008 Estado · RF-009 Prioridad · RF-010 Fecha límite · RF-011 Filtro estado · RF-012 Filtro prioridad · RF-013 Filtro fecha · RF-014 Dashboard.

## Reglas
Cada tarea pertenece a un usuario; un usuario solo administra sus tareas; estados PENDIENTE/EN_PROGRESO/COMPLETADA; prioridades BAJA/MEDIA/ALTA; fecha opcional; vencida si due_date es anterior a la fecha actual y no está completada; operaciones protegidas requieren autenticación.
