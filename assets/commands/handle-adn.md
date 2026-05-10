---
description: Mapea o actualiza el ADN técnico (Stack y DevOps) de un proyecto en la base de datos central.
agent: AdnManager
---

## Herramientas de Genética

- **Sincronizar ADN**: `sko_project({ action: "upsert", project: "UUID", name: "Nombre", stack: "JSON_Stack", devops: "JSON_DevOps" })`
- **Obtener ADN**: `sko_project({ action: "get", project: "UUID" })`

## Protocolo de Mapeo Técnico

1.  **Escaneo de Terreno**: Realizar un análisis profundo de la arquitectura actual (archivos de configuración, lenguajes, frameworks).
2.  **Extracción de ADN**:
    - **Stack**: Identificar lenguajes, backend, frontend y herramientas de construcción.
    - **DevOps**: Detectar Dockerfiles, configuraciones de docker-compose, puertos y contenedores.
3.  **Sincronización SSOT**: Ejecutar `sko_project(upsert)` para registrar o actualizar la verdad técnica del proyecto.
4.  **Alineación de Contexto**: Asegurar que el mapeo refleje fielmente la realidad para que el `@Maestro` y el `@Arquitecto` operen con datos precisos en las siguientes fases.
