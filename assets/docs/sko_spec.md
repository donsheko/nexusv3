# Protocolo SKO-SPEC v3 (Protocolo SDD)

Este protocolo rige la interacción entre agentes, la base de datos y el sistema de archivos para garantizar la integridad y el aprendizaje continuo en Sko-Nexus.

## 🛠️ Herramientas del Ecosistema MCP

- `sko_spec(action, data)`: Gestión de la misión (start, get, update, complete).
- `sko_adn(action, project_id)`: Consulta de la genética técnica.
- `sko_step(action, data)`: Gestión del DAG de tareas (create, get, next, end).
- `sko_heartbeat(step_id, message)`: Reporte de progreso en tiempo real.
- `sko_sdr(action, data)`: Gestión de la Bitácora de Sabiduría (add, search).

---

## 🔄 El Flujo Maestro de Orquestación

### Fase 1: Specify (Refinamiento de Intención)
**Comando:** `/sko-init`
**Agente:** @Maestro
1.  **Captura**: Recibe la historia de usuario.
2.  **Mapeo**: Identifica asunciones y las presenta al usuario.
3.  **Loop**: Preguntas 1 a 1 (con barra de progreso y opciones) para resolver asunciones rechazadas.
4.  **SSOT**: Ejecuta `sko_spec({action: "start", ...})` registrando la intención y las asunciones validadas (`que_presupongo`).

### Fase 2: Design (Arquitectura y Planificación)
**Comando:** `/sko-analyze $spec_id`
**Agente:** @Arquitecto
1.  **Contexto**: Lee la Spec y el ADN del proyecto.
2.  **Inspiración**: Consulta `sko_sdr({action: "search", ...})` para buscar patrones previos exitosos.
3.  **Plan**: Diseña la arquitectura y define los objetivos (`que_quiero_lograr`).
4.  **DAG**: Ejecuta `sko_step({action: "create", ...})` para poblar el listado de tareas atómicas.

### Fase 3: Develop (Ejecución del DAG)
**Comando:** `/sko-step-run $agent $step_id $spec_id $project_id`
**Agente:** $agent (Especialista asignado)
1.  **Inicio**: Reporta `sko_heartbeat($step_id, "Tarea Recibida")`.
2.  **Implementación**: Ejecuta la lógica técnica. Reporta heartbeats por cada hito importante.
3.  **Cierre Técnico**: Ejecuta `sko_step({action: "end", id: $step_id})`.
4.  **Sabiduría**: Ejecuta `sko_sdr({action: "add", ...})` para documentar lecciones, ejemplos y contraejemplos.

### Fase 4: Validate (Auditoría Técnica)
**Comando:** `/sko-audit $spec_id`
**Agente:** @Consultor (Invocado bajo demanda por el Usuario)
1.  **Análisis**: Revisa el cumplimiento de la Spec y la calidad del código.
2.  **Hallazgos**: Registra problemas o deudas en `audit_steps`.
3.  **Cierre**: Si no hay bloqueos, ejecuta `sko_spec({action: "complete", id: $spec_id})`.

### Fase 5: Consolidate (Higiene de Memoria)
**Agente:** @Consolidador
1. **Sintetizar**: Lee los campos `sdr` de todos los steps de la misión.
2. **Compactar**: Genera una entrada de sabiduría de alta densidad.
3. **Persistir**: Ejecuta `sko_sdr({action: "add", ...})` para guardar en `sdr_col` y limpia el ruido operativo.

---

## 🏛️ Estructura SSOT (Single Source of Truth)

Toda la orquestación se apoya en el esquema de base de datos definido en `/prisma/schema.prisma`. Los agentes tienen terminantemente prohibido actuar sin sincronizar su estado con la DB a través de las herramientas MCP.
