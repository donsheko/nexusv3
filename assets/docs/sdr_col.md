# Documentación: Bitácora de Sabiduría (SDR_COL)

La tabla `sdr_col` es el repositorio de aprendizaje dinámico de Sko-Nexus. No solo registra el "qué", sino el "cómo" y el "porqué" de cada decisión técnica.

## 🛠️ Herramientas de Gestión

- `sko_sdr_search(project_id, query)`: Busca patrones, ejemplos y lecciones en la bitácora consolidada.
- `sko_step("sdr", step_id, content)`: Registra la sabiduría "en bruto" del ejecutor en el campo `sdr` de la tabla `steps_spec`.
- `sko_sdr_consolidate(spec_id)`: Herramienta usada por el @Consolidador para sintetizar los campos `sdr` de los steps en una entrada única para `sdr_col`.

---

## 📋 Mapeo de Campos y Responsabilidades

### 1. Sabiduría en Bruto (Tabla: steps_spec)
- **Responsable**: @Ejecutor (@Desarrollador / @Diseñador).
- **Momento**: Al finalizar el step.
- **Contenido**: Detalles técnicos, fricción, ejemplos de código y lecciones aprendidas durante la ejecución específica de esa tarea.

### 2. Sabiduría Consolidada (Tabla: sdr_col)
- **Responsable**: @Consolidador.
- **Momento**: Al finalizar la Spec (o hito importante).
- **Contenido**: Versión sintetizada y de alta densidad de todas las lecciones de la misión.

---

## 🔄 Flujo de Interacción por Comando

### 1. Fase de Planificación (`/sko-analyze`)
- **Agente**: @Arquitecto
- **Acción**: Ejecuta `sko_sdr_search` para poblar el campo `meta` de los nuevos steps basándose en éxitos pasados.

### 2. Fase de Ejecución (`/sko-step-run`)
- **Agente**: @Desarrollador / @Diseñador
- **Acción**: Al finalizar la tarea (Paso 7 del comando), ejecuta `sko_sdr_add`.
- **Mandatorio**: Debe incluir al menos un **ejemplo** o **contraejemplo** si la tarea implicó lógica compleja.

### 3. Fase de Auditoría (`/sko-audit`)
- **Agente**: @Consultor
- **Acción**: Si la auditoría falla, actualiza el campo `dudas_pendientes` o `contraejemplos` para evitar que otros agentes caigan en el mismo error durante el fix.

---

## 🎯 Objetivo Final
Que el sistema se vuelva más inteligente con cada `step_id` completado. Un @Arquitecto en la misión #100 debería ser infinitamente más preciso que en la misión #1 gracias a la densidad de información en `sdr_col`.
