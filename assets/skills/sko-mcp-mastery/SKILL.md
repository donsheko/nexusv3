---
name: sko-mcp-mastery
description: Manual Técnico de Herramientas del MCP Sko-Brain (v2.6)
version: 2.6
stack: ["MCP", "Prisma", "Zod", "API-Design", "Heartbeat"]
---

# 🛠️ SKO_MCP_MASTERY v2.6 (API DOCS)

Este manual detalla el uso exacto de las herramientas consolidadas. Todo payload debe cumplir con los esquemas Zod definidos en el servidor.

## 1. GESTIÓN DE ADN: `sko_project`

**Acciones: `get`, `upsert`**

```json
{
  "action": "upsert",
  "project": "slug-proyecto",
  "stack": {"frontend": "React", "backend": "Next.js"},
  "devops": {"containers": []}
}
```

## 2. GESTIÓN DE MISIÓN (MICRO-TOOLS v2.5)

### 2.0 `sko_init` (Markdown Output)

Inyecta el contexto inicial del proyecto (ADN, resumen y tareas activas) en formato **Markdown**. Detecta automáticamente el nombre del proyecto usando la raíz de Git o el nombre de la carpeta actual.

**Payload (Zod Lite):**
```json
{
  "cwd": "/ruta/absoluta/al/proyecto"
}
```

**Retorno**: Texto Markdown estructurado con el ADN del proyecto (stack y contenedores), último resumen de sesión y una tabla de tareas activas. Todo listo para inyectarse directamente en el prompt del Maestro.

### 2.1 `sko_task_start`

Crea una nueva tarea en estado `in_progress`. Acepta un `artifacts` opcional con estructura `ArtifactsSchema` (plan, state, audit).

```json
{
  "project": "slug",
  "description": "Descripción de la misión",
  "tags": "opcional,tags",
  "agentName": "@maestro",
  "artifacts": {
    "plan": [
      {
        "step_id": 1,
        "title": "Paso 1",
        "agent": "@builder",
        "step_status": "pending"
      }
    ],
    "state": {
      "status": "active",
      "current_step": 1,
      "total_steps": 3,
      "percentage": 0
    }
  }
}
```

### 2.2 `sko_task_update`

Uso exclusivo del Maestro para cambios estructurales (plan, estado global). El campo `artifacts` sigue el `ArtifactsSchema` tipado (plan: NodeSchema[], state: StateSchema, audit: AuditEntrySchema[]).

```json
{
  "taskId": "id",
  "status": "completed | failed",
  "artifacts": {
    "plan": [
      {
        "step_id": 1,
        "title": "Paso completado",
        "step_status": "completed",
        "last_activity": "Reporte final"
      }
    ],
    "state": {
      "status": "completed",
      "percentage": 100,
      "last_updated": "2026-05-04T20:42:00.000Z"
    }
  }
}
```

### 2.3 ⚡ `sko_task_heartbeat` (REPORTE DE AGENTES)

Actualiza el `last_activity` y `step_status` de un nodo específico.

```json
{
  "taskId": "id",
  "step_id": 1,
  "last_activity": "Descripción del progreso",
  "step_status": "in_progress | completed | failed",
  "updatedAt": "timestamp-previo",
  "agentName": "@builder"
}
```

### 2.4 `sko_task_audit`

Única vía para interactuar con `artifacts.audit`.

```json
{
  "taskId": "id",
  "observation_id": "OBS-001",
  "step_id": 1,
  "priority": "alta",
  "findings": "Error detectado",
  "fix_status": "pending | fixed | verified"
}
```

### 2.5 `sko_task_get_updated_at`

Recuperar el timestamp fresco antes de un cierre de nodo.

```json
{"taskId": "id"}
```

### 2.6 `sko_task_get` / `sko_task_list` / `sko_task_delete`

Herramientas de consulta y limpieza de misiones.

**`sko_task_list`** retorna los resultados en formato **Markdown** (tabla) para mejorar la legibilidad en el prompt:

```json
{
  "project": "mi-proyecto",
  "scope": "pending"
}
```

**`sko_task_get`** retorna el objeto JSON completo de la tarea.
**`sko_task_delete`** elimina una tarea de la base de datos.

---

## 3. GESTIÓN DE BUNDLE: `sko_subagent_bundle`

**Acción: `get`**
Es la **primera acción** que debe ejecutar un sub-agente al despertar.

```json
{
  "action": "get",
  "taskId": "id-de-tarea"
}
```

**Retorno**: Un JSON con `stack`, `devops`, `description`, `updatedAt` y el `artifacts` actual (DAG completo con `plan`, `activity` y `audit`). El campo `step_id` indica qué nodo del DAG está asignado al sub-agente que solicita.

> El campo `updatedAt` del bundle es el valor a usar en todos los `heartbeat` y `update` subsecuentes hasta recibir un nuevo timestamp de respuesta.

## 4. GESTIÓN DE SABIDURÍA: `sko_memory_read` / `sko_memory_write`

> ⛔ **FRAGMENTACIÓN v2.7**: La antigua herramienta única `sko_memory` ha sido fragmentada en dos herramientas especializadas para optimizar el esquema de permisos y el consumo de tokens:
> - `sko_memory_read` — Solo lectura (todos los agentes verificados)
> - `sko_memory_write` — Solo escritura (exclusivo del Maestro)

Ambas herramientas utilizan **Zod Lite**: parámetros planos en lugar de objetos anidados con `action`.

### 4.1 `sko_memory_read` (PÚBLICA — Lectura)

Parámetros planos (Zod Lite). Sin campo `action` ni objetos anidados. Todos los parámetros son opcionales.

```json
{
  "query": "término de búsqueda",
  "project": "slug",
  "type": "decision",
  "tags": "opcional"
}
```

Si no se provee ningún parámetro, retorna las últimas 10 memorias del proyecto activo. Si se provee `query`, utiliza búsqueda Full-Text Search (MySQL Boolean Mode) para resultados más precisos.

### 4.2 `sko_memory_write` (MAESTRO SOLO — Escritura)

> ⛔ **EXCLUSIVIDAD DEL MAESTRO**: Las acciones de escritura de `sko_memory_write` están reservadas exclusivamente para el Maestro. Los sub-agentes tienen acceso **SOLO LECTURA** vía `sko_memory_read`.

**Acciones: `commit`, `summary`, `update`, `delete`**

#### `commit`: Crear una nueva memoria

```json
{
  "action": "commit",
  "project": "slug",
  "content": "Memoria atómica de una operación completada.",
  "tags": "opcional",
  "type": "observation"
}
```

> Si `type` es `"session_summary"` y ya existe un resumen para el proyecto, lo actualiza automáticamente (UPSERT).

#### `summary`: Persistir resumen de sesión

```json
{
  "action": "summary",
  "project": "slug",
  "content": "Resumen actualizado de la sabiduría del proyecto.",
  "tags": "opcional"
}
```

#### `update`: Actualizar memoria existente

```json
{
  "action": "update",
  "id": "id-de-memoria",
  "content": "Contenido actualizado.",
  "tags": "opcional"
}
```

#### `delete`: Eliminar memoria

```json
{
  "action": "delete",
  "id": "id-de-memoria"
}
```

> ⚠️ **AVISO**: Si un sub-agente intenta ejecutar `sko_memory_write`, el MCP rechazará la solicitud con `Error: Prohibido — solo el Maestro puede escribir en memoria`.

## 5. GESTIÓN DE Skills: `sko_skill`

**Acciones: `get`, `sync`, `add`, `search`**

### `search`: Búsqueda Ligera (Solo Metadatos)

Busca skills por nombre, tópico o stack tecnológico. **Devuelve únicamente metadatos** (`id`, `name`, `topic`, `stack`) — el contenido completo de la skill NO se incluye en los resultados para minimizar el consumo de tokens.

```json
{
  "action": "search",
  "name": "prisma",
  "topic": "database",
  "stack": "node"
}
```

> Al menos uno de los parámetros (`name`, `topic` o `stack`) es requerido. La búsqueda es por coincidencia parcial (`contains`). Para obtener el contenido completo de una skill, usa la acción `get` con su nombre exacto.

### `add`: Registro/Actualización

Registra o actualiza una skill atómicamente en disco y DB.

```json
{
  "action": "add",
  "name": "nombre-skill",
  "content": "Contenido Markdown completo",
  "topic": "opcional",
  "stack": "opcional"
}
```

### `get`: Recuperación (Contenido Completo)

Obtiene una skill específica por su nombre, devolviendo **todos los campos** incluyendo el contenido completo (`id`, `name`, `content`, `topic`, `stack`).

```json
{
  "action": "get",
  "name": "nombre-skill"
}
```

### `sync`: Sincronización

Sincroniza las skills del disco con la base de datos.

```json
{
  "action": "sync"
}
```

## ⚠️ REGLA DE ORO DEL CONOCIMIENTO (v2.6)

**Principio**: `sko_skill` es el **ARSENAL** (qué sabe hacer el agente). `sko_memory_read` / `sko_memory_write` es la **SABIDURÍA** (qué aprendió del proyecto).

| Dimensión         | Herramienta                          | ¿Quién escribe? |
| :---------------- | :----------------------------------- | :-------------- |
| **Arsenal**       | `sko_skill`                          | Maestro         |
| **Sabiduría**     | `sko_memory_read` / `sko_memory_write` | Maestro (solo)  |
| **Contexto Vivo** | `sko_task_*`                         | Todos           |

> ⛔ **HARD-LOCK**: El tipo `"skill"` ha sido **ELIMINADO** de las herramientas de memoria (`sko_memory_read` / `sko_memory_write`). Las skills ahora se gestionan exclusivamente vía `sko_skill`. No duplicar conocimiento entre ambas herramientas.

---

## ⚠️ RESUMEN DE CUÁNDO USAR CADA ACCIÓN

| Situación                            | Herramienta Correcta                              |
| :----------------------------------- | :------------------------------------------------ |
| Sub-agente inicia un nodo del DAG    | `sko_task_heartbeat` (step_status: "in_progress") |
| Sub-agente reporta avance en su nodo | `sko_task_heartbeat` (actualiza `last_activity`)  |
| Sub-agente termina su nodo           | `sko_task_heartbeat` (step_status: "completed")   |
| Maestro inicializa el plan completo  | `sko_task_update` (artifacts.plan)                |
| Maestro cierra la tarea              | `sko_task_update` (status: "completed")           |
| @consultor emite veto                | `sko_task_audit`                                  |
| Sincronización Pre-Cierre            | `sko_task_get_updated_at`                         |
