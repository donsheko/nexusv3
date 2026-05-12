---
description: Analiza una especificación para crear el Grafo de Dependencias (DAG) y los pasos técnicos de la misión.
agent: arquitecto
---

$1 - proyecto_id (UUID del proyecto en Sko-Nexus)
$2 - ruta relativa del archivo Markdown de la misión dentro de `.sko-specs/`

Carga los manuales de operación antes de iniciar:

1. `~/.config/opencode/skills/sko-blueprint-template/SKILL.md` (Formato Blueprint)

## Herramientas de Planificación

- **Obtener ADN**: `sko_project({ action: "get", project: "UUID" })`
- **Consultar Sabiduría anterior**: `sko_sdr({ action: "search", project: "UUID", query: "conceptos_clave" })`

## RULES

**Exploracion asistida** Toda accion que requiera exploracion del proyecto debe ser delegada al subagente `@Explorador` para asegurar que se aproveche su capacidad de análisis de contexto y búsqueda eficiente en la base de datos.

## Ejecución del Diseño (Blueprint Mode)

1.  **Análisis de Contexto**: El archivo a analizar se encuentra en la carpeta `.sko-specs/`. Leer la historia de usuario y asunciones desde dicho archivo `.md`. Tienes libertad para **modificar o enriquecer** cualquier sección del archivo (Contexto, Historia, Asunciones) si el análisis técnico así lo requiere. Es obligatorio incluir al final del bloque `context` la **Estrategia Técnica Global** (patrones, librerías, blindaje) antes de redactar los pasos.
2.  **Consulta de Sabiduría**: Buscar en la Bitácora de Sabiduría (`sko_sdr`) y analizar logs o misiones previas relacionadas para identificar patrones técnicos o soluciones a problemas similares.
3.  **Diseño Técnico y Plan**: Redactar los pasos técnicos detallados (`### [STEP:N]`) siguiendo estrictamente la estructura de la skill `sko-blueprint-template`.
    3.1. **Pasos consecutivos por Agente**: Organizar los pasos en secciones claras por agente responsable (`@Desarrollador`, `@Diseñador`, etc.) para facilitar la delegación posterior.
    3.2. **Pasos consecutivos** En medida de lo posible las se deben pensar las tareas como acciones consecutivas por agentes para optimizar el contexto y poder pasar un agente pasos consecutivos ejemplo [STEP:12,13,14] para que el agente pueda aprovechar el contexto de los pasos anteriores y no tener que ser invocado múltiples veces con pasos individuales.
4.  **Definición Integral**: Para cada paso, definir agente, archivos involucrados (`context` - **usar rutas relativas al workspace que serán resueltas a absolutas por el ejecutor**) y lógica detallada (`meta`). Asegura que el plan sea coherente con las modificaciones realizadas en el contexto.
5.  **Blindaje Técnico**: Cada paso debe incluir en su `meta` criterios de aceptación claros y validaciones técnicas (ej: "Verificar que el endpoint retorne 200", "Validar schema de Zod").
6.  **Notificación de Cierre**: Una vez completado el análisis y el diseño en el archivo Markdown, informar al `@Maestro` que el Blueprint está listo para la validación final del usuario.
