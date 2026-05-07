---
description: Realiza una auditoría técnica final sobre los resultados de la misión.
agent: consultor
---

## Datos de la Spec y el Step

**Obtener Spec**: `sko-spec("get", $1)`
**Obtener Resultado Final**: `sko-audit-report($1)`
**Registrar Hallazgo**: `sko-audit-issue($1, "Título", "Descripción", "Plan_de_Fix")`
**Finalizar Misión**: `sko-mission-complete($1)`

## Ejecución de la Auditoría

1. Obtener la especificación original con `sko-spec("get", $1)` y el reporte de resultados técnicos con `sko-audit-report($1)`.
2. Analizar el código generado y validar que cumple con los criterios de aceptación y las asunciones validadas.
3. Si se encuentran errores o desviaciones:
    - Registrar cada punto utilizando `sko-audit-issue($1, "Título", "Descripción", "Plan_de_Fix")`.
    - Informar al Maestro sobre los bloqueos detectados.
4. Si la auditoría es exitosa y no quedan puntos pendientes, ejecutar `sko-mission-complete($1)` para cerrar la misión y marcarla como `completed` en la base de datos.
