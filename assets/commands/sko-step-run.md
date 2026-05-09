---
description: Ejecuta un paso específico del DAG utilizando el agente asignado.
agent: $1
---

## Datos del step y el proyecto

**Obtener Step**: `sko-step("get", $2)`
**Obtener Spec**: `sko-spec("get", $3)`
**Obtener Adn**: `sko-adn("get", $4)`
**Procesar Heartbeat**: `sko-step("heartbeat", $2, "Small description")`
**Finalizar Step**: `sko-step("end", $2)`
**Registrar Sabiduría**: `sko-sdr-add($2, $3)`
**Registrar Error**: `sko-step("error", $2, "Error: Descripción del error")`

## Ejecución del Step

1. Obtener y analizar el step utilizando `sko-step("get", $2)` y el spec del proyecto con `sko-spec("get", $3)`.
2. Mandar el primer heartbeat con `sko-step("heartbeat", $2, "Tarea Recibida Iniciando")` para indicar que el step ha comenzado.
3. Ejecutar la lógica del step.
4. Mandar un heartbeat por cada hito importante alcanzado con `sko-step("heartbeat", $2, "Tarea en Proceso-incluir log de progreso de menos de 50 caractereres")` para indicar que el step está en progreso.
5. Completar la ejecución del step y mandar un tercer heartbeat con `sko-step("heartbeat", $2, "Tarea Completada")` para indicar que el step ha finalizado exitosamente.
6. Finalizar el step utilizando `sko-step("end", $2)` para marcarlo como completado en el sistema.
7. **Consolidación de Sabiduría**: Ejecutar `sko-step("sdr", $2, "Contenido con estructura: que_paso, que_aprendi, ejemplos, contraejemplos")` para registrar la sabiduría en bruto en el step.

## Manejo de Errores

- Si se encuentra un error durante la ejecución del step, mandar un heartbeat con `sko-step("heartbeat", $2, "Error: Descripción del error")` para informar al Maestro sobre el bloqueo.
- Registrar el error utilizando `sko-step("error", $2, "Error: Descripción del error")` para documentar el incidente en el sistema y facilitar la auditoría posterior.
- Informar al Maestro sobre el bloqueo detectado y solicitar orientación para resolverlo.
