---
description: Analiza los aprendizajes de una misión completa para consolidar la sabiduría en el repositorio central (SDR_COL).
agent: consolidador
---

## Herramientas de Consolidación
- **Obtener Datos Misión**: `sko_spec({ action: "get", id: $1 })`
- **Obtener Aprendizajes**: `sko_consolidator({ specId: $1 })`
- **Registrar Sabiduría (SDR_COL)**: `sko_sdr({ action: "register_wisdom", project: "UUID", specId: $1, quePaso: "...", queAprendi: "...", ... })`
- **Actualizar Resumen Proyecto**: `sko_sdr({ action: "consolidate", project: "UUID", content: "Resumen_Consolidado", tags: "tags", sdrIds: "ID1,ID2" })`
- **Cierre de Consolidación**: El Consolidador no cierra la Spec, delega esta acción al `@Maestro`.

## Protocolo de Síntesis Técnica

1.  **Análisis de Misión**: Revisar la ejecución completa de la misión y los reportes de auditoría usando `sko_consolidator`.
2.  **Extracción de Sabiduría**: Identificar patrones recurrentes, soluciones a "blockers" y decisiones arquitectónicas clave.
3.  **Registro SDR_COL**: Poblar la tabla de Sabiduría Profunda usando `action: "register_wisdom"`. Seguir la guía de llenado detallada abajo.
4.  **Consolidación de Proyecto**: Actualizar el resumen global del proyecto (`action: "consolidate"`) vinculando las nuevas entradas de SDR_COL mediante `sdrIds`.
5.  **Cierre de Consolidación**: Notificar al `@Maestro` que la sabiduría ha sido integrada. El control regresa al Maestro para la validación final.

## Guía de Llenado SDR_COL (Síntesis Meta-Cognitiva)

SDR_COL es la fusión de la **Bitácora COL (Comprensión Ordenada del Lenguaje)** y los **SDR (Spec Driven Records)**. Su objetivo no es solo registrar qué se hizo, sino *cómo se comprendió*.

| Campo | Nivel COL | Propósito Meta-Cognitivo | Ejemplo / Guía |
| :--- | :--- | :--- | :--- |
| **quePaso** | 1 (Básico) | **Relato de los hechos**: Descripción objetiva del desafío o tarea. | "Error 500 al intentar validar el token de sesión tras 15 min de inactividad." |
| **queSenti** | 1 (Básico) | **Componente afectivo**: Registrar la fricción, curiosidad o frustración. Ayuda a identificar 'bloqueos' mentales. | "Incertidumbre al notar que el error no aparecía en logs locales pero sí en producción." |
| **queAprendi** | 1 (Básico) | **Darse cuenta**: La "toma de conciencia". El descubrimiento de la causa raíz o el nuevo concepto. | "Me di cuenta que el balanceador de carga estaba eliminando el header de autorización por exceso de tamaño." |
| **queQuieroLograr** | 2 (Avanzado) | **Prospectiva e Intencionalidad**: Cómo se aplicará esta comprensión para transformar la práctica futura. | "Diseñar middlewares de auditoría que detecten la integridad de headers antes de llegar al servicio de Auth." |
| **quePresupongo** | 2 (Avanzado) | **Análisis de asunciones**: Identificar las creencias previas que resultaron ser prejuicios o errores de juicio. | "Se asumió que el límite de tamaño de headers era el estándar de 8kb, pero en el proxy estaba limitado a 2kb." |
| **conceptosClave** | - | **Anclajes**: Términos técnicos que permiten la recuperación rápida de este registro. | "Session Token, Load Balancer, Header Size, Auth.js" |
| **ejemplos** | - | **Evidencia Metódica**: Descripción narrativa de la solución o patrón que funcionó. **EVITAR CÓDIGO**. | "Ajustar la configuración de buffers del proxy inverso para permitir headers de hasta 16kb y sincronizar el límite en el servidor de aplicaciones." |
| **contraejemplos** | - | **Vía Negativa**: Descripción de la aproximación o patrón que falló. **EVITAR CÓDIGO**. | "Intentar resolver el problema mediante la fragmentación del token o el aumento del TTL, lo cual no atacaba la restricción física del proxy." |
| **dudasPendientes** | - | **Frontera del conocimiento**: Lo que esta bitácora aún no resuelve y requiere otra misión. | "¿Cómo afecta esta ampliación de buffer a la vulnerabilidad de ataques DoS?" |
