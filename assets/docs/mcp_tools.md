# Documentación Técnica: MCP Tools (Sko-Nexus v3)

Este documento detalla las herramientas disponibles en el Model Context Protocol (MCP) de Sko-Nexus, sus acciones, parámetros y el comportamiento esperado de cada una.

---

## 🛠 sko_init
**Propósito**: Carga el contexto inicial del proyecto y asegura la existencia de la infraestructura de misiones. Es el punto de partida obligatorio.

### Acciones
No tiene parámetro `action`. Se ejecuta directamente con el nombre del proyecto.

### Parámetros
- `project` (string): Nombre del directorio raíz del proyecto. **Debe coincidir exactamente** con el nombre de la carpeta actual.

### Comportamiento
1. **Validación de Identidad**: Si el nombre proporcionado no coincide con el directorio raíz, lanza un error con sugerencias.
2. **Persistencia**: Busca el proyecto en la DB. Si no existe, lo crea con ADN "Por definir".
3. **Estructura**: Crea la carpeta `.sko-specs/` si no existe.
4. **Validación de ADN**: Si el proyecto no tiene ADN registrado (stack/devops), lanza un error bloqueante indicando el **UUID** y solicitando la ejecución de `/handle-adn`.
5. **Contexto**: Retorna el ADN actual y el último resumen narrativo de la sesión previa.

---

## 🧬 sko_project
**Propósito**: Gestiona la genética técnica (Stack y DevOps) y la identidad de los proyectos.

### Acciones
- `get`: Obtiene la información completa de un proyecto.
- `upsert`: Crea o actualiza un proyecto asegurando la consistencia de identidad.
- `delete`: Elimina un proyecto de la base de datos.

### Parámetros
- `action` (enum): `get`, `upsert`, `delete`.
- `project` (string): UUID o nombre del proyecto (identificador principal).
- `name` (string, opcional): Nuevo nombre para el proyecto (usado en `upsert`).
- `stack` (string, opcional): JSON con la definición del stack tecnológico.
- `devops` (string, opcional): JSON con la definición de infraestructura/operaciones.

### Comportamiento (Upsert)
- Busca primero por UUID o Nombre actual.
- Si existe, actualiza los campos proporcionados sin duplicar el registro.
- Si no existe, crea uno nuevo.

---

## 📝 sko_spec
**Propósito**: Gestiona el ciclo de vida de las Especificaciones (Misiones).

### Acciones
- `start`: Crea una nueva Spec manualmente.
- `get`: Obtiene el detalle de una Spec, incluyendo sus pasos y auditorías.
- `update`: Actualiza metadatos de la Spec.
- `complete`: Marca una Spec como completada (requiere validaciones Hard-Lock).
- `sync`: Sincroniza el porcentaje de progreso basado en el estado de los pasos.
- `parse_spec`: Procesa un archivo Blueprint (`.md`) y lo convierte en una Spec con sus Steps en la DB.
- `delete`: Elimina una Spec de la base de datos.

### Parámetros clave
- `id` (number): ID único de la Spec.
- `filePath` (string): Ruta al archivo `.md` (usado en `parse_spec`).
- `projectId` (string): UUID del proyecto vinculado.

---

## 🪜 sko_step
**Propósito**: Gestiona el Grafo de Dependencias (DAG) y la ejecución de pasos individuales.

### Acciones
- `create`: Crea un nuevo paso vinculado a una Spec.
- `get`: Obtiene el detalle de un paso.
- `next`: Busca el siguiente paso pendiente (`pending`) por orden numérico.
- `end`: Cierra un paso marcándolo como `COMPLETED` (requiere que tenga SDR registrado).
- `sdr`: Registra la sabiduría/bitácora atómica en el campo `sdr` del paso.
- `heartbeat`: Actualiza el estado del paso a `IN_PROGRESS` y registra un log de latido (máx. 70 caracteres).
- `delete`: Elimina un paso.

---

## 🔍 sko_audit
**Propósito**: Control de calidad y resolución de problemas técnicos durante una misión.

### Acciones
- `create`: Registra un hallazgo o problema técnico.
- `get`: Obtiene el detalle de una auditoría.
- `fix`: Marca la auditoría como resuelta (`fixed: true`).
- `delete`: Elimina un registro de auditoría.

---

## 🧠 sko_sdr
**Propósito**: Repositorio de Sabiduría Profunda (SDR_COL), consolidación de resúmenes (Summary) y fase de lectura de consolidación de misión.

### Acciones
- `sdr_upsert`: Crea o actualiza una entrada en `SdrCol` (Sabiduría Meta-Cognitiva). Si se proporciona `id`, actualiza la entrada existente; si no, crea una nueva. Reemplaza a `register_wisdom`. Requiere `specId` y al menos un campo COL.
- `summary_upsert`: Crea o sobrescribe el `Summary` global del proyecto. Si ya existe un resumen para el proyecto, lo actualiza; si no, lo crea. Reemplaza la escritura del antiguo `consolidate`. Requiere `content`. Opcional: `tags`, `sdrIds`.
- `consolidate`: **Fase de LECTURA** — Absorbe la lógica del antiguo `sko_consolidator`. Retorna un JSON estructurado con la Spec completa, todos sus Steps (con SDR) y todas sus Auditorías. Es la fuente de verdad que debe usar el `@Consolidador` antes de generar sabiduría.
- `search`: Búsqueda unificada en resúmenes (Summary) y sabiduría técnica (SdrCol). Retorna hasta 5 resultados de cada tabla.
- `sdr_delete`: Elimina una entrada de `SdrCol` por ID numérico. Reemplaza a `delete_wisdom`.
- `summary_delete`: Elimina un `Summary` por ID string. Reemplaza a `delete_summary`.

### Parámetros clave
- `project` (string, requerido): UUID del proyecto para todas las acciones.
- `id` (string, opcional): ID de la entrada — numérico para SdrCol, string para Summary.
- `specId` (number): ID de la Spec (requerido para `sdr_upsert` y `consolidate`).
- `content` (string): Contenido del resumen (requerido para `summary_upsert`).
- `query` (string): Término de búsqueda (requerido para `search`).
- `tags`, `sdrIds` (string, opcional): Usados en `summary_upsert`.

### Campos COL (sdr_upsert)
- `quePaso`: Relato objetivo de los hechos.
- `queSenti`: Componente afectivo/fricción.
- `queAprendi`: Toma de conciencia/causa raíz.
- `queQuieroLograr`: Prospectiva/Aplicación futura.
- `quePresupongo`: Análisis de asunciones/prejuicios previos.
- `conceptosClave`: Anclajes técnicos para recuperación rápida.
- `ejemplos`: Evidencia metódica de la solución (narrativa, sin código).
- `contraejemplos`: Vía negativa — patrón que falló.
- `dudasPendientes`: Frontera del conocimiento no resuelta.

### Nota de migración
Las acciones antiguas (`register_step`, `register_wisdom`, `consolidate` para escritura, `delete_wisdom`, `delete_summary`) han sido eliminadas. `register_step` estaba duplicada con `sko_step(sdr)` y se ha suprimido. El flujo de consolidación ahora es: (1) `sdr.consolidate` para lectura → (2) `sdr.sdr_upsert` para registrar sabiduría COL → (3) `sdr.summary_upsert` para actualizar el resumen global.

---

## 🧩 Helpers (mcp/helpers/)

### specMdToJsonParse.js
Es el corazón del protocolo **Sko-Spec v3**.
- **Función**: Parsea archivos Markdown y extrae:
  - Configuración (Frontmatter YAML).
  - Contexto global.
  - Bloques de pasos (`### [STEP: N]`).
  - Metadatos y dependencias entre pasos.
- **Validación**: Comprueba que no haya pasos duplicados, que las dependencias existan y que no haya dependencias circulares.
