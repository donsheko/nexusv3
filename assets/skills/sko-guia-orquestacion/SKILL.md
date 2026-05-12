---
name: sko-guia-orquestacion
description: Manual maestro del flujo de misiones y protocolos de delegación en Sko-Nexus.
---

# 🎼 Guía Maestra de Orquestación

Este documento define el ciclo de vida absoluto de una misión en Sko-Nexus. El Maestro debe seguir este orden para garantizar la integridad del sistema.

## 🏁 Fase 0: Situational Awareness

El Maestro inicia la sesión con el ADN y el último resumen ya cargados (vía `sko_init` automático). La carpeta `.sko-specs/` se asegura en este primer latido.

## 📝 Fase 1: Especificación e Inicio

Transformar la necesidad del usuario en un documento técnico de diseño esta etapa se inicia luego de que el usuario ejecuta `/sko-init`.

- **Agente**: `@VESPER`
- **Proceso resumen comando /sko-init**:
  1. Capturar historia de usuario y validar asunciones mediante diálogo interactivo.
  2. Una vez definida la misión, crear manualmente el archivo `.md` dentro de `.sko-specs/`.
  3. **Naming**: `YYYY-MM-DD_nombre-mision.md` (mision: 1-2 palabras descriptivas).
  4. Usar la skill `sko-blueprint-template` para la estructura.
- **Salida**: Ruta del archivo Markdown creado.

## 📐 Fase 2: Análisis y Diseño Técnico

El Arquitecto analiza el terreno y diseña el plan de acción.

- **Comando**: `/sko-analyze $proyecto_id $ruta_archivo_md`
- **Agente**: `@Arquitecto`
- **Proceso**:
  1. Analizar sabiduría previa (`sko_sdr`) y logs técnicos.
  2. **Refinar Contexto**: Puede modificar la historia o asunciones en el MD si detecta necesidades técnicas no previstas.
  3. **Escribir Plan**: Redactar los pasos técnicos (`[STEP:N]`) siguiendo el template.
  4. **Pausa de Transparencia**: El sistema se detiene para que el usuario revise/edite el archivo físicamente.

## Fase 3: Revisión y Aprobación del Usuario

El Maestro presenta el plan al usuario para su aprobación. El usuario puede solicitar cambios, modificar el plan manualmente o aprobarlo tal cual. Solo tras la aprobación se procede a la siguiente fase. Solo tras la aprobación explícita del usuario, el Maestro ejecuta el comando `sko_spec(action: "parse_spec", filePath: "...")` para convertir el plan en registros de base de datos.

## 🔗 Fase 4: Sincronización y Registro (Parse)

Convertir el diseño aprobado en registros de base de datos.

- **Comando**: `sko_spec(action: "parse_spec", filePath: "...")`
- **Agente**: `@Maestro`
- **Proceso**:
  1. El Maestro invoca el parser tras la aprobación del usuario.
  2. El MCP valida el formato, resuelve dependencias y crea la Spec y los Steps masivamente.
  3. El comando retorna el JSON con todos los IDs generados.

## 🛑 Reglas de Oro para Agentes (Blindaje)

1. **Resolución de Rutas**: Las rutas en los documentos de especificación (Blueprints) deben ser **relativas al workspace** para garantizar portabilidad. Sin embargo, el agente ejecutor tiene la obligación de resolverlas a **rutas absolutas** antes de pasarlas a cualquier herramienta MCP (`read`, `edit`, `write`).
2. **Uso de Herramientas MCP**: No utilices comandos de shell para leer o buscar archivos si existe una herramienta MCP equivalente.
3. **Atomicidad de Commits**: No realices commits si el usuario no lo ha solicitado explícitamente o si no es parte integral del paso asignado.
4. **Validación de ADN**: Antes de cualquier cambio estructural, consulta el ADN del proyecto para asegurar la compatibilidad con el stack definido.

## 🔨 Fase 5: Ejecución Distribuida

**Prohibida la ejecución de esta fase sin la fase 3 y 4 completada**. El Maestro orquesta la ejecución técnica delegando a los agentes especialistas según el plan diseñado.

Delegar los pasos del DAG a los agentes especialistas usando los IDs obtenidos en la Fase 3.

- **Comandos**:
  - `/sko-build $step_ids` -> `@Desarrollador [$step_ids_consecutivos]`
  - `/sko-design $step_ids` -> `@Diseñador [$step_ids_consecutivos]`
- **Argumento**: `$step_ids` puede ser un ID único o un listado de IDs (ej: `[12, 13, 14]`).
- **Setps Agrupados**: El Maestro debe agrupar en un solo array los steps consecutivos que puedan ser ejecutados por el mismo agente para optimizar aprovechar una sola ventana de contexto del sub-agente y evitar multiples invocaciones a un mismo agente con pasos individuales.
- **Protocolo Obligatorio**: Cada ejecutor debe cargar la skill `sko-protocol-step-run` para manejar heartbeats y SDR por cada paso del lote.

## 🔍 Fase 6: Verificación de Entrega (Checkpoint)

El Maestro presenta los resultados preliminares. Si la ejecución técnica ha terminado, se procede a la consolidación antes del cierre definitivo.

## 📚 Fase 7: Consolidación de Sabiduría (SDR)

Extraer y persistir el conocimiento generado durante la misión.

- **Comando**: `/sko-consolidate $spec_id`
- **Agente**: `@Consolidador`
- **Proceso**:
  1. Extraer aprendizajes de los pasos técnicos.
  2. Poblar `SDR_COL` y `sko_sdr` (Summary).

## 🏁 Fase 8: Cierre Final y Pausa de Validación

El Maestro retoma el control total para el cierre oficial.

- **Agente**: `@Maestro`
- **Proceso**:
  1. **Resumen Ejecutivo**: Presentar al usuario un resumen final de lo logrado.
  2. **Pausa de Validación**: Esperar aprobación explícita del usuario.
  3. **Caminos de Salida**:
     - **A) Finalización**: `sko_spec(action: "complete", id: $spec_id)`.
     - **B) Auditoría**: Si el usuario duda, invocar `/sko-audit $spec_id`.
     - **C) Ajustes**: Si se requieren cambios, agregar nuevos pasos al DAG y volver a Fase 3.
- **Hard-Lock**: Solo el `@Maestro` tiene la autoridad para ejecutar `sko_spec(complete)`. No se puede cerrar si hay auditorías pendientes (`fixed: false`).

---

## 🚦 Tabla de Comandos y Argumentos

| Comando              | Argumento  | Destino          |
| :------------------- | :--------- | :--------------- |
| `/sko-init`          | (Nulo)     | `@Maestro`       |
| `/sko-analyze`       | (Archivo)  | `@Arquitecto`    |
| `parse_spec`         | (Archivo)  | `@Maestro`       |
| `/sko-build`         | `$step_id` | `@Desarrollador` |
| `/sko-design`        | `$step_id` | `@Diseñador`     |
| `/sko-explore`       | `$step_id` | `@Explorador`    |
| `/sko-audit`         | `$spec_id` | `@Consultor`     |
| `/sko-consolidate`   | `$spec_id` | `@Consolidador`  |
| `sko_spec(complete)` | `$spec_id` | `@Maestro`       |
