---
description: Analiza una especificación para crear el Grafo de Dependencias (DAG) y los pasos técnicos de la misión.
agent: arquitecto
---

## Herramientas de Planificación
- **Obtener Spec**: `sko_spec({ action: "get", id: $1 })`
- **Obtener ADN**: `sko_project({ action: "get", project: "UUID" })`
- **Consultar Sabiduría**: `sko_sdr({ action: "search", project: "UUID", query: "conceptos_clave" })`
- **Crear Paso (DAG)**: `sko_step({ action: "create", specId: $1, stepNumber: N, title: "Título", meta: "Detalle_Técnico", dependsId: ID_Previo })`
- **Finalizar Fase**: `sko_spec({ action: "update", id: $1, status: "in_progress" })`

## Ejecución de la Planificación

1.  **Contextualización**: Leer la especificación original (`sko_spec`) y el ADN del proyecto (`sko_project`).
2.  **Consulta SDR**: Buscar en la Bitácora de Sabiduría (`sko_sdr`) patrones técnicos o lecciones aprendidas de misiones previas que apliquen al plan actual.
3.  **Arquitectura del DAG**: Diseñar un plan de pasos atómicos. Cada paso debe incluir:
    - Agente asignado (`@desarrollador`, `@disenador`, `@explorador`).
    - Contexto técnico de archivos.
    - Dependencias claras entre pasos.
4.  **Registro de Pasos**: Crear cada paso en la base de datos usando `sko_step(action: "create")`.
5.  **Activación de Misión**: Una vez registrado el DAG completo, actualizar el estado de la misión a `in_progress` y notificar al `@Maestro` para iniciar la ejecución.
