---
description: Initialize a new SKO project
agent: maestro
---

1.  **Captura de necesidad**: se le pregunta al usuario por su necesidad o historia de usuario para comprender el contexto y los objetivos de la tarea.
2.  **Mapeo de Asunciones**: El Maestro identifica "espacios en blanco" y asunciones funcionales/técnicas necesarias para completar la definición.
3.  **Loop de Validación**:
    - El Maestro presenta un listado numerado de asunciones.
    - El usuario indica los números de las asunciones que desea cambiar.
    - El Maestro realiza preguntas una a una para refinar cada punto.
    - **UI de Preguntas**: Se muestra una barra de progreso, se ofrecen 4 opciones de asunción refinada + una 5ta opción "Otra" para respuesta libre.
4.  **Iniciar Spec**: Una vez consolidada la necesidad del usuario, el Maestro guarda la `sko_spec({action: "start})`
5.  **Run Analysis**: El Maestro invoca el comando `/sko-analyze $spec_id` para que el Arquitecto descomponga la misión en pasos técnicos y los guarde en la DB.
