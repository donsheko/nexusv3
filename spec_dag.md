# 🗺️ DAG de Misión: Evolución Sabiduría Refinada (v3.2)

## 📋 Información de Misión
- **Proyecto:** nexusv3
- **Descripción:** Reestructuración de la arquitectura de memoria (Prisma), refactorización y centralización de Tools MCP en `sko_sdr.js` y blindaje de protocolos de cierre.
- **Spec de Referencia:** `@spec_modificaciones.md`

---

## 🏗️ Grafo de Dependencias (DAG)

### [Nodo 1] - Reestructuración de Persistencia (Prisma)
- **Agente:** `@builder`
- **Acción:** 
  1. Eliminar modelo `Memory` y sus referencias en `Project` y `SdrCol`.
  2. Crear modelo `Summary` con campos: `id`, `projectId`, `content` (text), `tags`, `sdrIds` (string para IDs de bitácoras vinculadas), `createdAt`, `updatedAt`.
  3. Asegurar que `StepSpec` tenga el campo `sdr` (String @db.Text).
  4. Ejecutar `npx prisma generate`.
- **Archivos:**
  - `prisma/schema.prisma`
- **Dependencias:** Ninguna.

### [Nodo 2] - Centralización y Refactorización de sko_sdr.js
- **Agente:** `@builder`
- **Acción:** 
  1. **Eliminar `mcp/tools/sko_memory.js`**.
  2. Refactorizar `mcp/tools/sko_sdr.js` para ser el único endpoint de sabiduría con acciones delimitadas:
     - `register_step`: Guarda el entendimiento del agente en `StepSpec.sdr`.
     - `consolidate`: (Para el @consolidator) Crea/Edita `Summary` y `SdrCol`.
     - `search`: Búsqueda por relevancia unificada analizando `Summary.content` y campos clave de `SdrCol`, apoyado en `Summary.sdrIds`.
  3. Asegurar que la acción de edición permita la sobrescritura del resumen narrativo por parte del `@consolidator`.
- **Archivos:**
  - `mcp/tools/sko_sdr.js`
  - `mcp/tools/sko_memory.js` (Eliminar)
- **Dependencias:** [1]

### [Nodo 3] - Protocolo de Cierre Atómico de Step
- **Agente:** `@builder`
- **Acción:** 
  1. Modificar `mcp/tools/sko_step.js`.
  2. Implementar validación: No se permite `step_status: COMPLETED` si `StepSpec.sdr` está vacío.
- **Archivos:**
  - `mcp/tools/sko_step.js`
- **Dependencias:** [2]

### [Nodo 4] - Rediseño de sko_init (Entrada Narrativa)
- **Agente:** `@builder`
- **Acción:** 
  1. Modificar `mcp/tools/sko_init.js` para retornar ADN + último registro de `Summary`.
  2. Limpiar la respuesta para que sea puramente narrativa, ocultando metadatos técnicos como `sdrIds`.
- **Archivos:**
  - `mcp/tools/sko_init.js`
- **Dependencias:** [2]

### [Nodo 5] - Endpoint sko_consolidator (Recopilación Total)
- **Agente:** `@builder`
- **Acción:** 
  1. Crear el tool `mcp/tools/sko_consolidator.js`.
  2. Implementar función que retorne la **Spec completa** (todos los campos del modelo `Spec`) y todos los campos `sdr` de sus `StepSpec` relacionados.
- **Archivos:**
  - `mcp/tools/sko_consolidator.js`
- **Dependencias:** [3]

### [Nodo 6] - Hard-Lock de Cierre de Spec
- **Agente:** `@builder`
- **Acción:** 
  1. Modificar `mcp/tools/sko_spec.js`.
  2. Implementar validación global: Impedir cierre de la `Spec` si no existe la entrada correspondiente en `Summary` y `SdrCol` vinculada a la sesión.
- **Archivos:**
  - `mcp/tools/sko_spec.js`
- **Dependencias:** [5]

### [Nodo 7] - Protocolo de Síntesis y Curación
- **Agente:** `@consolidator`
- **Acción:** 
  1. Utilizar `sko_consolidator` para obtener el contexto completo y analizar `AuditSpec`.
  2. Ejecutar la acción `consolidate` de `sko_sdr.js` para generar la sabiduría final refinada (SdrCol + Summary + sdrIds), priorizando la solución sobre el fallo.
- **Archivos:**
  - `mcp/tools/sko_sdr.js`
- **Dependencias:** [6]
