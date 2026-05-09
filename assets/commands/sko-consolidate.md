---
description: Analiza los aprendizajes de una misión completa para consolidar la sabiduría en el repositorio central (SDR_COL).
agent: consolidador
---

## Herramientas de Consolidación
- **Obtener Datos Misión**: `sko_spec({ action: "get", id: $1 })`
- **Obtener Aprendizajes**: `sko_step({ action: "get_learnings", specId: $1 })`
- **Registrar Sabiduría Global**: `sko_sdr({ action: "add", project: "UUID", data: "JSON_Estructurado" })`
- **Actualizar Memoria Atómica**: `sko_memory({ action: "commit", project: "UUID", type: "insight", content: "Resumen_Técnico", tags: "tags" })`
- **Cierre de Ciclo**: `sko_spec({ action: "complete", id: $1 })`

## Protocolo de Síntesis Técnica

1.  **Análisis de Misión**: Revisar la ejecución completa de la misión y los reportes de auditoría.
2.  **Extracción de Sabiduría**: Identificar patrones recurrentes, soluciones a "blockers" y decisiones arquitectónicas clave tomadas durante los pasos.
3.  **Registro SDR_COL**: Poblar la tabla de Sabiduría Profunda con el formato estándar:
    - **Qué Pasó**: Contexto del reto.
    - **Qué se Aprendió**: Lección técnica destilada.
    - **Ejemplos/Contraejemplos**: Fragmentos de código que ilustren la lección.
4.  **Higiene de Memoria**: Actualizar el Índice de Sabiduría Atómica (`sko_memory`) para que futuras misiones puedan encontrar este conocimiento rápidamente.
5.  **Finalización de Misión**: Marcar la misión como oficialmente completada usando `sko_spec(complete)`.
