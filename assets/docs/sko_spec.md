# Protocolo SKO-SPEC v3 (Protocolo SDD)

Este protocolo rige la interacción entre agentes y el sistema de archivos/DB para garantizar la integridad del proyecto Sko-Nexus.

## 1. El Flujo Maestro de Orquestación

El ciclo de vida de una misión no es automático; es un baile orquestado por comandos específicos que mueven el estado de la base de datos.

### Fase 1: El Refinamiento de Intención (@Maestro)
**Comando:** `/sko-init`
1.  **Activación**: El Maestro deja de ser un "solver" genérico y entra en modo **Specify**.
2.  **Captura de Historia**: El usuario entrega la necesidad o historia de usuario.
3.  **Mapeo de Asunciones**: El Maestro identifica "espacios en blanco" y asunciones funcionales/técnicas necesarias para completar la definición.
4.  **Loop de Validación**: 
    - El Maestro presenta un listado numerado de asunciones.
    - El usuario indica los números de las asunciones que desea cambiar.
    - El Maestro realiza preguntas una a una para refinar cada punto.
    - **UI de Preguntas**: Se muestra una barra de progreso, se ofrecen 4 opciones de asunción refinada + una 5ta opción "Otra" para respuesta libre.
5.  **Cierre**: Una vez consolidada la definición, el Maestro guarda la `Spec` en la DB con estado `pending` y notifica que está listo para el análisis.

### Fase 2: Arquitectura y Desglose (@Arquitecto)
**Comando:** `/sko-analyze $spec_id`
1.  **Invocación**: Se delega al Arquitecto pasando el ID de la especificación consolidada.
2.  **Análisis**: El Arquitecto lee el propósito, contexto y asunciones validadas.
3.  **Plan Técnico**: Define el stack, endpoints, lógica detallada y restricciones.
4.  **Generación de Steps**: Crea todos los registros en la tabla `steps_spec` (DAG), descomponiendo el plan en tareas atómicas y vinculándolas.
5.  **Handover**: Al finalizar, actualiza el estado de la `Spec` a `in_progress` y devuelve el control al Maestro para la ejecución.

### Fase 3: Ejecución y Supervisión (@Maestro)
**Comando:** `/sko-run $spec_id`
1.  **Despacho**: El Maestro actúa como orquestador, leyendo los pasos del DAG.
2.  **Delegación**: Invoca a los especialistas (`@Desarrollador`, `@Diseñador`, `@Explorador`) según corresponda a cada `step_id`.
3.  **Validación**: Al concluir los pasos, se puede invocar al `@Consultor` para la auditoría final.

---

## 2. Gobernanza de Datos (SSOT)

- **Projects**: El ADN del proyecto (Stack, DevOps).
- **Specs**: El contenedor de la misión, su propósito y asunciones consolidadas.
- **Steps**: El Grafo de Dependencias (DAG) que contiene la ejecución técnica.
- **SDR (Sabiduría)**: Registro de lecciones aprendidas durante cada ejecución.
