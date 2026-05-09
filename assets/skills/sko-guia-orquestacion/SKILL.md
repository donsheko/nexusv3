---
name: sko-guia-orquestacion
description: Manual maestro del flujo de misiones y protocolos de delegación en Sko-Nexus v3.
---

# 🎼 Guía Maestra de Orquestación (v3)

Este documento define el ciclo de vida absoluto de una misión en Sko-Nexus. El Maestro debe seguir este orden para garantizar la integridad del sistema.

## 🏁 Fase 0: Mapeo Genético
Antes de iniciar cualquier misión, el proyecto debe tener su ADN registrado.
*   **Comando**: `/handle-adn`
*   **Agente**: `@AdnManager`
*   **Propósito**: Identificar el stack técnico y el entorno DevOps.

## 📝 Fase 1: Especificación y Captura
Transformar la necesidad del usuario en una misión técnica formal.
*   **Comando**: `/sko-init`
*   **Agente**: `@Maestro`
*   **Proceso**:
    1. Capturar historia de usuario.
    2. Loop de validación de asunciones.
    3. Registro en DB: `sko_spec(action: "start", ...)`
*   **Salida**: ID de la misión ($spec_id).

## 📐 Fase 2: Planificación (DAG)
Descomponer la misión en pasos atómicos y técnicos.
*   **Comando**: `/sko-analyze $spec_id`
*   **Agente**: `@Arquitecto`
*   **Proceso**:
    1. Crear Pasos: `sko_step(action: "create", specId: $spec_id, ...)`
    2. Activar Misión: `sko_spec(action: "update", id: $spec_id, status: "in_progress")`

## 🔨 Fase 3: Ejecución Distribuida
Delegar los pasos del DAG a los agentes especialistas. Se recomienda agrupar pasos consecutivos asignados al mismo agente para mantener el contexto.
*   **Comandos**:
    *   `/sko-build $step_ids` -> `@Desarrollador`
    *   `/sko-design $step_ids` -> `@Diseñador`
    *   `/sko-explore $step_ids` -> `@Explorador`
*   **Argumento**: `$step_ids` puede ser un ID único o un listado de IDs (ej: `[12, 13, 14]`).
*   **Protocolo Obligatorio**: Cada ejecutor debe cargar la skill `sko-protocol-step-run` para manejar heartbeats y SDR por cada paso del lote.

## 🔍 Fase 4: Control de Calidad
Validar que los resultados cumplan con los estándares.
*   **Comando**: `/sko-audit $spec_id`
*   **Agente**: `@Consultor`
*   **Acciones**: `sko_audit(action: "create" | "fix")`.
*   **Hard-Lock**: No se puede cerrar un paso con hallazgos pendientes.

## 📚 Fase 5: Consolidación de Sabiduría
Cerrar el ciclo de aprendizaje y la misión.
*   **Comando**: `/sko-consolidate $spec_id`
*   **Agente**: `@Consolidador`
*   **Proceso**:
    1. Extraer aprendizajes de los pasos.
    2. Poblar `SDR_COL` y `sko_memory`.
    3. Finalizar misión: `sko_spec(action: "complete", id: $spec_id)`

---

## 🚦 Tabla de Comandos y Argumentos

| Comando | Argumento | Destino |
| :--- | :--- | :--- |
| `/handle-adn` | (Nulo) | `@AdnManager` |
| `/sko-init` | (Nulo) | `@Maestro` |
| `/sko-analyze` | `$spec_id` | `@Arquitecto` |
| `/sko-build` | `$step_id` | `@Desarrollador` |
| `/sko-design` | `$step_id` | `@Diseñador` |
| `/sko-explore` | `$step_id` | `@Explorador` |
| `/sko-audit` | `$spec_id` | `@Consultor` |
| `/sko-consolidate` | `$spec_id` | `@Consolidador` |
