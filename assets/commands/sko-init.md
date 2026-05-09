---
description: Inicializa una nueva misión en Sko-Nexus capturando la necesidad del usuario y validando asunciones.
agent: maestro
---

Carga el manual maestro de orquestación desde `~/.config/opencode/skills/sko-guia-orquestacion/SKILL.md` para entender el ciclo de vida completo de la misión.

## Herramientas de Misión
- **Iniciar Spec**: `sko_spec({ action: "start", title: "Título_Misión", projectId: "UUID", context: "Historia_Usuario" })`

## Flujo de Especificación (Protocolo v3)

1.  **Captura de Necesidad**: Solicitar al usuario su historia de usuario o requerimiento técnico para comprender el contexto.
2.  **Mapeo de Asunciones**: Identificar "puntos ciegos" (funcionales o técnicos) y generar una lista de asunciones necesarias para proceder.
3.  **Loop de Validación**:
    - Presentar la lista de asunciones numerada.
    - El usuario indica qué números desea refinar o cambiar.
    - Realizar preguntas una a una para cada asunción rechazada:
        - Mostrar **Barra de Progreso** del refinamiento.
        - Ofrecer **4 opciones sugeridas**.
        - Ofrecer una **5ta opción ("Otra")** para entrada libre.
4.  **Registro SSOT**: Una vez consolidado, registrar la misión usando `sko_spec(action: "start")`.
5.  **Delegación de Análisis**: Invocar al `@Arquitecto` mediante el comando `/sko-analyze $spec_id` para iniciar la fase de planificación.
