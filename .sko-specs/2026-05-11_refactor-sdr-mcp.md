---
project_id: efb1aa6c-83ef-466c-8e1f-65d80920b508
title: Refactorización y Consolidación del Motor de Sabiduría (SDR)
context: |
  Se ha detectado redundancia y falta de claridad semántica en las herramientas de sabiduría (SDR) del MCP. 
  Específicamente:
  - `register_step` en `sko_sdr` duplica la funcionalidad de `sko_step(sdr)`.
  - Los nombres de las acciones en `sko_sdr` no son técnicos (`register_wisdom`, `consolidate`).
  - `sko_consolidator` existe como una herramienta separada cuando debería ser una fase de lectura dentro de `sko_sdr`.

  Objetivo: Simplificar el motor SDR, unificar la lógica de consolidación en un solo punto y mejorar la semántica de las acciones para facilitar la orquestación de agentes.
---

## 🛠️ PLAN DE EJECUCION

### [STEP:1]
- **TITLE**: Refactorización de sko_sdr.js y Unificación de Consolidación
- **AGENT**: @desarrollador
- **DEPENDS_ON**: null
- **CONTEXT**: 
> mcp/tools/sko_sdr.js
> mcp/tools/sko_consolidator.js
- **META**: 
> Implementar la nueva estructura de acciones en sko_sdr:
> - sdr_upsert (reemplaza register_wisdom, soporta creación/edición).
> - summary_upsert (reemplaza consolidate escritura).
> - consolidate (absorbe sko_consolidator lógica de lectura).
> - sdr_delete (reemplaza delete_wisdom).
> - summary_delete (reemplaza delete_summary).
> Eliminar la acción register_step.

### [STEP:2]
- **TITLE**: Eliminación de sko_consolidator.js y Limpieza de MCP
- **AGENT**: @desarrollador
- **DEPENDS_ON**: 1
- **CONTEXT**: 
> mcp/tools/sko_consolidator.js
> mcp/index.js
- **META**: 
> Eliminar el archivo sko_consolidator.js.
> Asegurar que el servidor MCP cargue correctamente las herramientas actualizadas.

### [STEP:3]
- **TITLE**: Actualización de Documentación Técnica y Assets
- **AGENT**: @desarrollador
- **DEPENDS_ON**: 2
- **CONTEXT**: 
> assets/docs/mcp_tools.md
> assets/commands/sko-consolidate.md
- **META**: 
> Documentar exhaustivamente los nuevos endpoints y acciones en mcp_tools.md.
> Actualizar el comando /sko-consolidate para reflejar el nuevo flujo (Fase de lectura vía sdr.consolidate y fase de escritura vía sdr.summary_upsert).

## 🏁 FIN DEL BLUEPRINT
