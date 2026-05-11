---
description: Mapea o actualiza el ADN técnico (Stack y DevOps) de un proyecto en la base de datos central.
agent: AdnManager
---

## Herramientas de Genética

- **Sincronizar ADN**: `sko_project({ action: "upsert", project: "UUID", stack: "JSON_Stack", devops: "JSON_DevOps" })`
- **Obtener ADN**: `sko_project({ action: "get", project: "UUID" })`

## Protocolo de Mapeo Técnico

1.  **Validación de Identidad (Hard-Lock)**:
    - Es OBLIGATORIO recibir el UUID del proyecto desde el comando `/handle-adn`.
    - Queda TERMINANTEMENTE PROHIBIDO crear un nuevo proyecto si no se encuentra un registro existente con el UUID proporcionado. Si no hay UUID, solicita al usuario ejecutar `sko_init` primero.
2.  **Escaneo de Terreno**: Realizar un análisis profundo de la arquitectura actual (archivos de configuración, lenguajes, frameworks).
3.  **Extracción de ADN**:
    - **Identidad**: Utilizar SIEMPRE el UUID proporcionado como identificador (`project`). No intentar renombrar el proyecto ni utilizar nombres basados en archivos internos como `package.json`.
    - **Stack**: Identificar lenguajes, backend, frontend y herramientas de construcción.
    - **DevOps**: Detectar Dockerfiles, configuraciones de docker-compose, puertos y contenedores.
4.  **Sincronización SSOT**: Ejecutar `sko_project(upsert)` pasando el UUID en el campo `project`.
5.  **Alineación de Contexto**: Asegurar que el mapeo refleje fielmente la realidad para que el `@Maestro` y el `@Arquitecto` operen con datos precisos en las siguientes fases.
