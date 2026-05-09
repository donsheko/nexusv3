---
description: Analiza los aprendizajes de una misión completa para consolidar la sabiduría en el repositorio central (SDR_COL).
agent: consolidador
---

## Herramientas de Consolidación
- **Obtener Datos Misión**: `sko_spec({ action: "get", id: $1 })`
- **Obtener Aprendizajes**: `sko_consolidator({ specId: $1 })`
- **Consolidar Resumen**: `sko_sdr({ action: "consolidate", project: "UUID", content: "Resumen_Consolidado", tags: "tags" })`
- **Cierre de Consolidación**: El Consolidador no cierra la Spec, delega esta acción al `@Maestro`.

## Protocolo de Síntesis Técnica

1.  **Análisis de Misión**: Revisar la ejecución completa de la misión y los reportes de auditoría.
2.  **Extracción de Sabiduría**: Identificar patrones recurrentes, soluciones a "blockers" y decisiones arquitectónicas clave tomadas durante los pasos.
3.  **Registro SDR_COL**: Poblar la tabla de Sabiduría Profunda con el formato estándar:
    - **Qué Pasó**: Contexto del reto.
    - **Qué se Aprendió**: Lección técnica destilada.
    - **Ejemplos/Contraejemplos**: Fragmentos de código que ilustren la lección.
4.  **Higiene de Memoria**: Actualizar el Índice de Sabiduría Atómica (`sko_sdr`) para que futuras misiones puedan encontrar este conocimiento rápidamente.
5.  **Cierre de Consolidación**: Notificar al `@Maestro` que la sabiduría ha sido integrada. El control regresa al Maestro para la validación final con el usuario.
