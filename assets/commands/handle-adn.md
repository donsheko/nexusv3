---
description: Mapear o actualizar el ADN del proyecto (Stack & DevOps) en la base de datos central.
agent: adn-manager
---

## Herramientas de Identidad

**Sincronizar ADN**: `sko-project("upsert", $1, "Nombre_Proyecto", "JSON_Stack", "JSON_DevOps")`
**Obtener ADN Actual**: `sko-project("get", $1)`

## Misión de Genética Técnica

1. **Escaneo de Terreno**: Realizar un análisis profundo de la arquitectura actual (archivos de configuración, lenguajes, frameworks).
2. **Extracción de ADN**:
    - **Stack**: Identificar lenguajes, backend, frontend y herramientas de construcción.
    - **DevOps**: Detectar Dockerfiles, configuraciones de docker-compose, puertos y contenedores.
3. **Sincronización SSOT**: Ejecutar `sko-project("upsert", $1, ...)` para registrar o actualizar el ADN en la base de datos utilizando el ID del proyecto `$1`.
4. **Validación**: Verificar que el mapeo refleje fielmente la realidad del proyecto para que el @Maestro y el @Arquitecto operen con datos precisos.
