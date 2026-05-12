---
description: Inicializa una nueva misión en Sko-Nexus capturando la necesidad del usuario y validando asunciones.
---

Carga los manuales de operación antes de iniciar:

1. `~/.config/opencode/skills/sko-guia-orquestacion/SKILL.md` (Orquestación)
2. `~/.config/opencode/skills/sko-blueprint-template/SKILL.md` (Formato Spec Blueprint)

## Flujo de Especificación (Protocolo v3.3 - Blueprint Mode)

1.  **Captura de Necesidad**: Solicitar al usuario su historia de usuario o requerimiento técnico para comprender el contexto. Puedes incluir una sección preliminar de "Contexto Técnico" si el usuario ya tiene claras las herramientas o el enfoque arquitectónico.
2.  **Mapeo de Asunciones**: Identificar "puntos ciegos" (funcionales o técnicos) y generar una lista de asunciones necesarias para proceder.
3.  **Loop de Validación**:
    - Presentar la lista de asunciones numerada.
    - El usuario indica qué números desea refinar o cambiar.
    - Realizar preguntas una a una para cada asunción rechazada hasta consolidar la base de la misión.
4.  **Creación del Blueprint**: Una vez definida la misión, crea manualmente el archivo `.md` dentro de la carpeta `.sko-specs/`.
    - **Nombre de archivo**: `YYYY-MM-DD_nombre-mision.md` (donde `nombre-mision` son 1-2 palabras clave descriptivas).
    - **Plantilla**: Utilizar la estructura de la skill `sko-blueprint-template`.
5.  **Delegación de Diseño**: Invocar al `@Arquitecto` mediante el comando `/sko-analyze $proyecto_id $ruta_archivo` indicar el id del proyecto y la ruta del archivo recién creado para que realice el análisis técnico y redacte los pasos detallados de la misión ejecutar el comando solo con los argumentos indicados, el analyze sabra que hacer al recibir el comando.
