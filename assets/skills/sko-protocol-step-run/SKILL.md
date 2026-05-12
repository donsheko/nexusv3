---
name: sko-protocol-step-run
description: Protocolo estándar de Sko-Nexus para la ejecución de pasos del DAG, reportes de progreso (heartbeat) y consolidación de sabiduría atómica.
---

# 💓 Protocolo de Ejecución de Pasos por Lote

Este protocolo es obligatorio para cualquier agente que ejecute uno o varios pasos asignados en el Grafo de Dependencias (DAG).

## 🛠️ Herramientas de Operación

- **Obtener step context**: `sko_step({ action: "get", id: $ID })`
- **Latido (Heartbeat)**: `sko_step({ action: "heartbeat", id: $ID, data: "Mensaje_Corto" })`
- **Registrar Sabiduría**: `sko_step({ action: "sdr", id: $ID, data: "JSON_Aprendizajes" })`
- **Finalizar Paso**: `sko_step({ action: "end", id: $ID })`

## 📋 Flujo Operativo por Lote

1.  **Sincronización Inicial y Pre-vuelo**: Recibe el listado de IDs asignados. Antes de ejecutar, valida que tienes acceso a los archivos mencionados en el `context` de los pasos. **Importante**: Las rutas en el `context` suelen ser relativas; debes resolverlas a rutas absolutas usando el `working directory` actual antes de invocar herramientas MCP.
2.  **Ciclo de Paso (SECUENCIAL E ININTERRUMPIDO)**:
    Debes procesar los pasos uno por uno. Está TERMINANTEMENTE PROHIBIDO pasar al paso N+1 sin haber cerrado completamente el ciclo del paso N (incluyendo su SDR y cierre físico).

    Por cada ID en el lote, ejecuta este orden exacto:
    - **A) Apertura**: Carga el contexto del paso actual con `sko_step(get)`. Emite un heartbeat: `"Iniciando ejecución..."`.
    - **B) Validación**: Verifica que las dependencias estén `COMPLETED`.
    - **C) Ejecución Técnica**: Realiza los cambios de código o análisis solicitados. Resolve rutas a absolutas.
    - **D) Reporte (Heartbeats)**: Envía reportes de progreso durante la tarea.
    - **E) Sabiduría (SDR ATÓMICO)**: Registra los aprendizajes con `sko_step(sdr)`. **Este paso es el Hard-Lock para el cierre.**
    - **F) Cierre Físico**: Solo tras confirmar el éxito del SDR, ejecuta `sko_step(end)`.

3.  **Transición**: Solo después del cierre físico (F), procede al siguiente ID del lote.

## ⚠️ Manejo de Bloqueos

Si un paso del lote falla críticamente, reporta el `"ERROR:"` vía heartbeat, cierra el paso como `failed` si es posible, y detén el procesamiento del resto del lote para consultar al `@Maestro`.
