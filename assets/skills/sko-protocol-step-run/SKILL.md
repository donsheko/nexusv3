---
name: sko-protocol-step-run
description: Protocolo estándar de Sko-Nexus para la ejecución de pasos del DAG, reportes de progreso (heartbeat) y consolidación de sabiduría atómica.
---

# 💓 Protocolo de Ejecución de Pasos por Lote (v3)

Este protocolo es obligatorio para cualquier agente que ejecute uno o varios pasos asignados en el Grafo de Dependencias (DAG).

## 🛠️ Herramientas de Operación
- **Obtener Contexto**: `sko_step({ action: "get", id: $ID })`
- **Latido (Heartbeat)**: `sko_step({ action: "heartbeat", id: $ID, data: "Mensaje_Corto" })`
- **Registrar Sabiduría**: `sko_step({ action: "sdr", id: $ID, data: "JSON_Aprendizajes" })`
- **Finalizar Paso**: `sko_step({ action: "end", id: $ID })`

## 📋 Flujo Operativo por Lote

1.  **Sincronización Inicial**: Recibe el listado de IDs asignados. Analiza el objetivo global del lote para mantener la coherencia técnica.
2.  **Ciclo de Paso (Repetir por cada ID en el lote)**:
    *   **Apertura**: Carga el contexto del paso actual con `sko_step(get)`. Emite un heartbeat: `"Iniciando ejecución..."`.
    *   **Ejecución**: Realiza los cambios de código o análisis. **Mantén el contexto de los pasos anteriores del lote** para evitar redundancias o conflictos.
    *   **Latidos**: Envía reportes intermedios (máx 70 chars).
    *   **Cierre de Sabiduría**: Registra los aprendizajes específicos de este paso con `sko_step(sdr)`.
    *   **Finalización**: Ejecuta `sko_step(end)`. 
3.  **Transición**: Si hay más pasos en el lote, procede inmediatamente al siguiente sin perder la memoria de trabajo.

## ⚠️ Manejo de Bloqueos
Si un paso del lote falla críticamente, reporta el `"ERROR:"` vía heartbeat, cierra el paso como `failed` si es posible, y detén el procesamiento del resto del lote para consultar al `@Maestro`.

