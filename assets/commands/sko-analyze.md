---
description: Analiza una especificación para crear el Grafo de Dependencias (DAG) y los pasos técnicos de la misión.
agent: arquitecto
---

Carga los manuales de operación antes de iniciar:
1. `~/.config/opencode/skills/sko-guia-orquestacion/SKILL.md` (Orquestación v3)
2. `~/.config/opencode/skills/sko-blueprint-template/SKILL.md` (Formato Blueprint)

## Herramientas de Planificación
- **Obtener ADN**: `sko_project({ action: "get", project: "UUID" })`
- **Consultar Sabiduría**: `sko_sdr({ action: "search", project: "UUID", query: "conceptos_clave" })`

## Ejecución del Diseño (Blueprint Mode)

1.  **Análisis de Contexto**: El archivo a analizar se encuentra en la carpeta `.sko-specs/`. Leer la historia de usuario y asunciones desde dicho archivo `.md`. Tienes libertad para **modificar o enriquecer** cualquier sección del archivo (Contexto, Historia, Asunciones) si el análisis técnico así lo requiere, siempre respetando la estructura del Blueprint.
2.  **Consulta de Sabiduría**: Buscar en la Bitácora de Sabiduría (`sko_sdr`) y analizar logs o misiones previas relacionadas para identificar patrones técnicos o soluciones a problemas similares.
3.  **Diseño Técnico y Plan**: Redactar los pasos técnicos detallados (`### [STEP:N]`) siguiendo estrictamente la estructura de la skill `sko-blueprint-template`.
4.  **Definición Integral**: Para cada paso, definir agente, archivos involucrados (`context`) y lógica detallada (`meta`). Asegura que el plan sea coherente con las modificaciones realizadas en el contexto.
5.  **Notificación de Cierre**: Una vez completado el análisis y el diseño en el archivo Markdown, informar al `@Maestro` que el Blueprint está listo para la validación final del usuario.
