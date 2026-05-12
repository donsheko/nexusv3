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
2.  **Ciclo de Paso (Repetir por cada ID en el lote)**:
    - **Apertura**: Carga el contexto del paso actual con `sko_step(get)`. Emite un heartbeat: `"Iniciando ejecución..."`.
    - **Validación de Dependencias**: Verifica que los pasos de los que depende este ID estén marcados como `COMPLETED` en la base de datos (si el @Maestro no lo filtró previamente).
    - **Ejecución**: Realiza los cambios de código o análisis. **Mantén el contexto de los pasos anteriores del lote** para evitar redundancias o conflictos. Resolve las rutas de archivos a absolutas para las herramientas `read`/`edit`.
    - **Latidos**: Envía reportes intermedios (máx 70 chars).
    - **Cierre de Sabiduría**: Registra los aprendizajes específicos de este paso con `sko_step(sdr)`.
    - **Finalización**: Ejecuta `sko_step(end)`.
3.  **Transición**: Si hay más pasos en el lote, procede inmediatamente al siguiente sin perder la memoria de trabajo.

## ⚠️ Manejo de Bloqueos

Si un paso del lote falla críticamente, reporta el `"ERROR:"` vía heartbeat, cierra el paso como `failed` si es posible, y detén el procesamiento del resto del lote para consultar al `@Maestro`.
