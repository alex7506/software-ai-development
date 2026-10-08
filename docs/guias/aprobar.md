# Aprobar documentos y fases

Aprobar es **exclusivamente humano**. `ai-dev approve` solo funciona en una terminal interactiva y pide escribir tu nombre para confirmar; si lo ejecuta un agente de IA, se rechaza.

## Aprobar un documento
1. Quien lo redactó lo envía a revisión:
   ```bash
   ai-dev submit PRD-001
   ```
2. El responsable lo revisa y decide:
   ```bash
   ai-dev approve PRD-001 --by "Ana Pérez" --role PRODUCT_OWNER
   ai-dev approve PRD-001 --by "Ana Pérez" --role PRODUCT_OWNER --request-changes --comment "Faltan criterios en FR-004"
   ai-dev approve PRD-001 --by "Ana Pérez" --role PRODUCT_OWNER --reject --comment "Fuera de alcance"
   ```

Con `--request-changes` o `--reject`, el documento vuelve a borrador (o a PROPOSED, en ADR y solicitudes de cambio).

## Modificar algo ya aprobado
La aprobación guarda una huella del contenido. Si alguien edita el documento después, `ai-dev validate` lo detecta. Para cambiarlo legítimamente:

```bash
ai-dev revise PRD-001     # vuelve a revisión y sube la versión (1.0.0 → 1.1.0)
# editar…
ai-dev approve PRD-001 --by "Ana Pérez" --role PRODUCT_OWNER
```

Los ADR aceptados no se revisan: se crea uno nuevo con una relación `SUPERSEDES`.

## Aprobar una fase
```bash
ai-dev phase check                     # ¿está todo?
ai-dev approve DEFINITION --by "Ana Pérez" --role PRODUCT_OWNER
ai-dev phase advance
```

- Solo se aprueba la fase actual, y solo si sus entregables, comprobaciones y gates están completos.
- Cada fase tiene su rol aprobador (ver la [referencia de fases](../referencia/catalogo/fases.md)).
- En STANDARD y CRITICAL, quien redactó un entregable de la fase no puede aprobarla.
- En CRITICAL, ARCHITECTURE, TECHNOLOGY y RELEASE necesitan **dos personas distintas** (la segunda puede ser SECURITY_OFFICER).

## Cambios después de publicar
En EVOLUTION, un cambio importante entra como solicitud de cambio:

```bash
ai-dev new CHANGE_REQUEST --title "Notificaciones por email"
# completar el análisis de impacto y reentry_phase
ai-dev submit CHANGE-001
ai-dev approve CHANGE-001 --by "Ana Pérez" --role PRODUCT_OWNER
ai-dev phase reenter --change CHANGE-001
```

## Dónde queda registrado
Todas las decisiones se guardan en `.ai-dev/approvals.yaml` con persona, rol, fecha, versión y huella del documento. Ese archivo solo crece: no se edita a mano.
