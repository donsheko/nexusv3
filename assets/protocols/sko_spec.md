# Protocolo SKO-SPEC v3 (Protocolo SDD)

Este protocolo rige la interacción entre agentes y el sistema de archivos/DB para garantizar la integridad del proyecto Sko-Nexus.

## 1. Ciclo de Vida de Misión (SDD)

Toda intervención técnica debe seguir estas 5 etapas:

1.  **Specify**: Captura de intención y requisitos de alto nivel.
2.  **Plan**: Definición de arquitectura, stack, modelos de datos y descomposición en tareas atómicas.
3.  **Task**: Desglose del plan en una lista de tareas (`steps_spec`) pequeñas y accionables.
4.  **Implement**: Ejecución técnica de las tareas atómicas.
5.  **Validate**: Auditoría final para asegurar el cumplimiento de la especificación.

## 2. Gobernanza de Datos (SSOT)

- **Projects**: El ADN del proyecto (Stack, DevOps).
- **Specs**: El contenedor de la misión actual.
- **Steps**: El Grafo de Dependencias (DAG) de la ejecución.
- **SDR (Sabiduría)**: Bitácora de aprendizaje y lecciones aprendidas durante la ejecución.

## 3. Reglas de Operación (Lazy Loading)

1.  **Identidad Mínima**: Los agentes inician con un contexto ligero.
2.  **Carga Quirúrgica**: Los agentes deben leer manuales (`assets/protocols`) y habilidades (`assets/skills`) bajo demanda usando sus herramientas de exploración.
3.  **Prohibición de Redundancia**: No inyectar protocolos en los prompts de sistema; referenciarlos mediante rutas físicas.

## 4. Orquestación de Agentes

- La delegación se realiza mediante el campo `agent` en los comandos de misión.
- Todo agente debe reportar su progreso actualizando el `current_step` y el `status` en la base de datos a través del MCP.
