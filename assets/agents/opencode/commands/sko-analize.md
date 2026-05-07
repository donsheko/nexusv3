---
description: Analiza una especificación consolidada para crear el plan técnico y el DAG de tareas.
agent: arquitecto
---

## Datos de la Spec y el Proyecto

**Obtener Spec**: `sko-spec("get", $1)`
**Obtener Adn**: `sko-adn("get", $2)`
**Consultar Sabiduría**: `sko-sdr-search($2, "Query")`
**Crear Plan (DAG)**: `sko-plan-create($1, "JSON_PLAN")`
**Finalizar Análisis**: `sko-analyze-end($1)`

## Ejecución del Análisis

1. Obtener y analizar la especificación consolidada utilizando `sko-spec("get", $1)` y el ADN del proyecto con `sko-adn("get", $2)`.
2. Consultar la Bitácora de Sabiduría usando `sko-sdr-search($2, "conceptos_clave")` para identificar lecciones aprendidas o patrones exitosos/fallidos de misiones anteriores que apliquen a este plan.
3. Diseñar un plan técnico detallado que descomponga la misión en pasos atómicos (DAG).
3. Cada paso del plan debe incluir: título, agente asignado (`@desarrollador`, `@disenador`, `@explorador`), objetivos (`meta`) y contexto técnico de archivos.
4. Registrar el plan completo en el sistema utilizando `sko-plan-create($1, "JSON_PLAN")`.
5. Una vez confirmado el registro del DAG, finalizar el proceso utilizando `sko-analyze-end($1)` para notificar al Maestro que la misión está lista para ejecución.
