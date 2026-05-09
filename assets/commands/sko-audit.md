---
description: Audita los resultados de un paso o de la misión completa, emitiendo hallazgos o liberando bloqueos.
agent: consultor
---

## Herramientas de Auditoría
- **Obtener Spec**: `sko_spec({ action: "get", id: $1 })`
- **Listar Pasos**: `sko_step({ action: "get_all", specId: $1 })`
- **Registrar Hallazgo**: `sko_audit({ action: "create", stepId: $2, title: "Título_Error", issuesFound: "Descripción", fixPlan: "Pasos_para_corregir" })`
- **Validar Corrección**: `sko_audit({ action: "fix", id: Audit_ID })`

## Protocolo de Control de Calidad

1.  **Revisión de DAG**: Analizar el estado de todos los pasos de la misión.
2.  **Validación Técnica**: Verificar que el código generado por los subagentes cumpla con los estándares de Sko-Nexus y los criterios de la especificación.
3.  **Gestión de Veto**:
    - Si se detecta un fallo, registrarlo mediante `sko_audit(create)`. Esto bloquea el cierre del paso afectado.
    - El subagente responsable deberá corregir el issue y notificar al `@Consultor`.
4.  **Liberación**: Una vez validada la corrección, marcar el hallazgo como resuelto usando `sko_audit(fix)`.
5.  **Veredicto Final**: Informar al `@Maestro` cuando la misión esté lista para ser consolidada.
