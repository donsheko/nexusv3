---
name: sko-spec
description: Manual Operativo del Protocolo de Estado y Gestión de Tareas (v2.6.3)
version: 2.6.3
stack: ["Prisma", "MySQL-JSON", "DAG", "Micro-Tools", "Optimistic-Locking"]
---

# 📖 PROTOCOLO SKO-SPEC v2.6.3 (SSOT)

Este protocolo es la Ley Suprema de Sko-Nexus. Define cómo los agentes interactúan con la base de datos para mantener un estado de misión coherente y blindado ante colisiones.

## 🚦 1. EL VÍNCULO DE MISIÓN (BOOTSTRAP)

Todo sub-agente invocado por el Maestro DEBE recibir dos identificadores vitales en su mensaje de despertar:

1.  **taskId**: El ID único de la tarea en la base de datos.
2.  **step_id**: El ID del nodo del DAG que tiene asignado.

> ⛔ **PROHIBICIÓN**: Ningún sub-agente debe intentar adivinar su `taskId`. Si no lo recibe, debe solicitarlo al Maestro inmediatamente.

---

## 🏗️ 2. EL CAMPO `artifacts` (ESTRUCTURA SSOT)

### A. `state` (Control de Flujo)

- `status`: [active | paused | completed | failed]
- `current_step`: ID del nodo activo.
- `total_steps`: Número total de nodos.
- `percentage`: Progreso global (0-100).
- `last_updated`: Timestamp ISO de la última actualización del DAG.

> **⚠️ ACLARACIÓN v2.6.2**: El campo `state.status` utiliza `active` como estado interno del DAG (indica que la misión está corriendo a nivel de nodos). Sin embargo, para el **estado global de la tarea** en la base de datos y para comandos como `sko_task_update`, se DEBE usar `in_progress`. El monitor web (Nexus Global Console) solo muestra tareas cuyo estado global sea `in_progress` o `paused`.

> ⛔ **ADVERTENCIA DE NOMENCLATURA**: No confundir `state.status` (DAG) con `task.status` (Global). El monitor web solo sigue tareas en estado `in_progress` o `paused`.

### B. `plan` (DAG - El Grafo de la Verdad)

Colección de nodos técnicos. Cada nodo es un contenedor atómico:

```json
{
  "step_id": 1,
  "title": "Descripción breve/titulo del paso",
  "details": "Instrucciones detalladas para el agente",
  "agent": "@nombre",
  "depend_on": [IDs de nodos previos requeridos, nulo si no hay],
  "files": ["URLs o paths de archivos relevantes"],
  "skills": ["nombres de skills del Arsenal relevantes para este nodo"],
  "step_status": "pending | in_progress | completed | failed",
  "updatedAt": "Timestamp de última actualización",
  "last_activity": "reporte de actividad más reciente (heartbeat)"
}
```

> **NUEVO v2.6**: El campo `skills` lista las skills del Arsenal (`sko_skill`) relevantes para el nodo. El Maestro DEBE cargarlas y proveerlas al sub-agente en el prompt de invocación, en lugar de duplicar documentación en `sko_memory`.

### C. `audit` (Observaciones Estructuradas)

Colección de entradas de auditoría, gestionadas exclusivamente por el `@consultor`. Los ejecutores (`@builder`, etc.) solo pueden marcar observaciones como `fixed` vía `sko_task_audit`.

Cada entrada sigue el `AuditEntrySchema` (Zod):

```json
{
  "id": "OBS-001",
  "step_id": 1,
  "priority": "alta | media | baja",
  "findings": "Descripción del hallazgo o error",
  "fix_plan": "Plan de acción para corregir",
  "agent_fixer": "@builder",
  "status": "pending | fixed | verified",
  "timestamp": "2026-05-04T20:00:00.000Z"
}
```

> **NOTA**: El campo `status` dentro del entry refleja `fix_status` del payload. La herramienta `sko_task_audit` mapea `fix_status` → `status` internamente para consistencia del esquema.

---

## 💓 3. PROTOCOLO DE REPORTE Y CIERRE (OBLIGATORIO)

Un sub-agente tiene terminantemente PROHIBIDO usar `sko_task_update` para reportar progreso. Debe usar exclusivamente `sko_task_heartbeat`.

### PASO 1: Inicio de Actividad

Al tomar el control, el agente emite su intención:

```json
sko_task_heartbeat({ step_id: N, step_status: "in_progress", last_activity: "Iniciando..." })
```

### PASO 2: Reportes de Avance (Opcional)

Puede emitir heartbeats intermedios para actualizar su `last_activity`. Cada uno **SOBREESCRIBE** el reporte anterior del nodo. Calidad sobre cantidad.

> ⚠️ **HARD-LOCK (v2.5)**: El campo `last_activity` DEBE ser conciso (máximo 100 caracteres). Debe resumir la acción inmediata (ej: "Editando componente Header", "Validando DAG") para no saturar la vista del sidebar. El reporte detallado de cierre se envía en el Paso 3.

### PASO 3: Cierre de Nodo (CRÍTICO)

Para entregar su trabajo y liberar el DAG, el agente DEBE emitir un heartbeat final:

```json
sko_task_heartbeat({
  step_id: N,
  step_status: "completed",
  last_activity: "Descripción breve del resultado final (max 100 chars)."
})
```

> ⚠️ **NOTA**: Aunque el heartbeat final tenga el reporte breve para la UI, el agente puede enviar la información técnica extendida (logs, outputs detallados) a través del campo `output` si el MCP lo soporta, o confiar en el `summary` final del Maestro.

> ⚠️ **REGLA DE ORO**: Un sub-agente **NUNCA** debe intentar cerrar la tarea global (`state.status = 'completed'`). El cierre de la tarea es competencia exclusiva del motor MCP (automático) o del Maestro (manual).

### PASO 4: Protocolo de Sincronización Pre-Cierre (OPTIMISTIC LOCKING)

Antes de enviar un heartbeat con `step_status: completed`, el agente DEBE llamar a `sko_task_get_updated_at` para obtener el `updatedAt` exacto actual.

**Flujo obligatorio:**

```json
// 1. Obtener timestamp actualizado
{ "taskId": "id-de-tarea" } // Invocando a sko_task_get_updated_at
// Retorna: { "updatedAt": "2026-05-03T05:10:00.000Z" }

// 2. Cerrar nodo con el updatedAt fresco
sko_task_heartbeat({
  step_id: N,
  step_status: "completed",
  updatedAt: "2026-05-03T05:10:00.000Z",
  last_activity: "Reporte final."
})
```

> ⚠️ **RAZÓN**: Usar un `updatedAt` obsoleto en el heartbeat de cierre provocará un error de conflicto (Optimistic Locking). El `updatedAt` del bundle puede estar desactualizado si otros agentes han interactuado con la tarea desde tu último heartbeat.

### PASO 5: Higiene de Cierre (MANDATORIO MAESTRO)

Antes de marcar una tarea global como `completed`, el Maestro/Vesper DEBE verificar que **TODOS** los nodos del DAG en `artifacts.plan` y `artifacts.audit`(en caso de existir) estén completados y correctamente finalizados.

> ⛔ **HARD-LOCK**: Queda prohibido el cierre global si existen nodos en `in_progress` o `pending`. El Maestro debe emitir los heartbeats de cierre faltantes para garantizar la integridad visual y técnica de la Nexus Global Console.

> ⚠️ **REGLA DE ATOMICIDAD DE CIERRE (v2.6.3)**: Al ejecutar el cierre global (`sko_task_update` con `status: 'completed'`), el Maestro DEBE incluir el array `plan` completo con todos los nodos en estado `completed`. Está prohibido cerrar globalmente una tarea y enviar un heartbeat de nodo en paralelo, ya que el `update` puede sobrescribir el estado del plan del `heartbeat`, dejando nodos visualmente incompletos (fantasmas).

---

## 🔐 4. SEGURIDAD Y PERMISOS (HARD-LOCKS)

| Herramienta               | Permitida para...                             |
| :------------------------ | :-------------------------------------------- |
| `sko_task_start`          | Solo Maestro.                                 |
| `sko_task_heartbeat`      | Sub-agentes (Requiere `step_id`).             |
| `sko_task_audit`          | @consultor (Crear) / @builder (Marcar fixed). |
| `sko_task_update`         | Maestro (Estructural).                        |
| `sko_task_get_updated_at` | Todos los agentes involucrados.               |

## 🚫 PROHIBICIONES FINALES

- Prohibido emitir heartbeats sin `step_id` (excepto el Maestro).
- Prohibido sobrescribir el array `plan` completo vía `update` (excepto en el Protocolo de Cierre Global).
- Prohibido finalizar la sesión sin el heartbeat de cierre (`completed`) del nodo asignado.

---

## 📦 5. CAMPO `skills` EN EL DAG (NUEVO v2.6)

Cada nodo del `plan` ahora incluye un campo `skills` opcional que referencia las skills del Arsenal relevantes:

```json
{
  "step_id": 3,
  "title": "Configurar Prisma",
  "agent": "@builder",
  "skills": ["prisma-core", "prisma-mysql"],
  "files": ["prisma/schema.prisma"]
}
```

**Reglas**:
- Los valores en `skills` deben coincidir con nombres registrados en `sko_skill`.
- El Maestro es responsable de cargar estas skills y pasarlas como contexto al sub-agente.
- El sub-agente NO debe buscar skills in `sko_memory_read`. Usa `sko_skill(action: 'search')` si necesita consultar.

---

## ⚡ 6. PROTOCOLO DE OPTIMIZACIÓN DE TOKENS (DELEGACIÓN AGRUPADA) 🆕

### Principio
Cuando múltiples nodos del DAG comparten las mismas skills, el Maestro DEBE agrupar las referencias para minimizar el consumo de tokens en la invocación de sub-agentes.

### Regla de Agrupación
Si N nodos consecutivos en el DAG usan el mismo conjunto de skills, el Maestro carga las skills UNA SOLA VEZ y las inyecta en el contexto compartido.

```
Ejemplo:
  Nodo 3 → skills: ["prisma-core", "prisma-mysql"]
  Nodo 4 → skills: ["prisma-core", "prisma-mysql"]
  Nodo 5 → skills: ["prisma-core"]

  → Cargar prisma-core y prisma-mysql UNA SOLA VEZ.
  → Inyectar como contexto global para los nodos 3, 4 y 5.
```

### Hard-Locks de Optimización

1. **Sin Duplicados**: No cargar la misma skill más de una vez por lote de delegación.
2. **Referencia, No Copia**: El campo `skills` en el DAG contiene solo nombres. El contenido reside en el Arsenal (`sko_skill`).
3. **Prioridad de Contexto**: Las skills inyectadas tienen menor prioridad que las instrucciones del `details` del nodo. Si hay conflicto, gana `details`.
4. **Cache de Sesión**: Las skills cargadas durante una misión pueden mantenerse en memoria de contexto para toda la sesión del Maestro. No recargar a menos que el DAG cambie.

### Diagrama de Flujo

```
[Inicio Misión]
     │
     ▼
[Paso 1: Bootstrap + ADN]
     │
     ▼
[Paso 2: Radar de Memoria (sko_memory_read)]
     │
     ▼
[Paso 2.5: Radar de Arsenal (sko_skill.search — solo metadatos)] ◄── NUEVO
     │
     ▼
[Paso 3: Checkpoint de Consentimiento]
     │
     ▼
[Paso 4: Registro de Misión + DAG]
     │
     ▼
[Para cada lote de nodos con skills compartidas]:
     │
     ├── Cargar skills únicas del lote (sko_skill.get)
     ├── Inyectar en contexto del sub-agente
     └── Delegar ejecución
     │
     ▼
[Paso 5-6: Heartbeats + Cierre]
```

---

### ⚡ 6.1. REGLA DE ORO v2.6.1: DELEGACIÓN QUIRÚRGICA 🆕

> ⛔ **HARD-LOCK**: Queda **TERMINANTEMENTE PROHIBIDA** la sincronización masiva de conocimientos. El Maestro NO debe realizar operaciones que carguen el contenido completo de múltiples skills en una sola llamada. La acción `list` ha sido **ELIMINADA** del MCP por violar el presupuesto de tokens.

#### Principio
El Maestro opera bajo el paradigma de **Delegación Quirúrgica**: busca metadatos ligeros y solo carga contenido completo bajo demanda explícita de un nodo del DAG.

#### Flujo Correcto
1. **Radar Ligero**: `sko_skill(action: 'search', topic: "prisma")` — retorna solo metadatos (`id`, `name`, `topic`, `stack`). **NUNCA incluye el campo `content`**.
2. **Carga Bajo Demanda**: `sko_skill(action: 'get', name: "prisma-core")` — carga el contenido completo de una skill específica solo cuando un nodo del DAG la requiere explícitamente.
3. **Inyección Quirúrgica**: El contenido obtenido con `get` se inyecta en el prompt de invocación del sub-agente asignado a ese nodo.

#### Lo que PROHIBE esta regla
- ❌ **`sko_skill(action: 'list')`** — **NO EXISTE**. Fue eliminado del MCP. Cargar todas las skills simultáneamente es un despilfarro de tokens.
- ❌ **Pre-carga masiva**: NO cargar skills que no estén referenciadas por los nodos activos del DAG.
- ❌ **Esperar contenido en `search`**: La acción `search` solo devuelve metadatos. Para contenido, usar `get`.

#### Razón
Cada skill puede contener cientos de líneas de documentación técnica. Cargar N skills innecesarias multiplica el consumo de tokens por N, contradiciendo la misión fundacional de Sko-Nexus: **reducir el tamaño de contexto y el consumo de tokens**.

---

## 🔭 7. HARD-LOCK DE RADAR (BÚSQUEDA OBLIGATORIA)

El Radar es el sistema de consulta del Maestro que permite monitoreo en tiempo real del estado del proyecto. Los sub-agentes pueden contribuir a la Situational Awareness si tienen el rol `@radar`.

### Reglas de Soberanía del Radar:

1. **Búsqueda Mandatoria**: Un agente con rol `@radar` DEBE ejecutar `sko_memory_read` para conocer el estado vigente antes de actuar.
2. **Exclusividad de Escritura**: `sko_memory_write(action: 'commit' | 'summary' | 'update' | 'delete')` está **exclusivamente reservado para el Maestro**.
3. **Lectura Pública**: `sko_memory_read` es de acceso público para cualquier agente verificado.
4. **Fallback Inicial**: Si `sko_memory_read` no retorna resultados, se asume estado inicial y se procede con el plan.

> ⛔ **PROHIBICIÓN**: Los sub-agentes **NO DEBEN** usar `sko_memory_write` para escribir, modificar o eliminar memorias. Solo el Maestro tiene esa autoridad. Para lectura, usar `sko_memory_read`.

### Esquema de Permisos del Radar:

| Herramienta                        | Maestro | @radar | Sub-agente |
| :--------------------------------- | :-----: | :----: | :--------: |
| `sko_memory_read`                  |   ✅    |   ✅   |     ✅     |
| `sko_memory_write` (commit)        |   ✅    |   ❌   |     ❌     |
| `sko_memory_write` (summary)       |   ✅    |   ❌   |     ❌     |
| `sko_memory_write` (update)        |   ✅    |   ❌   |     ❌     |
| `sko_memory_write` (delete)        |   ✅    |   ❌   |     ❌     |
