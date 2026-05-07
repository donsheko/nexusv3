# SDD para sko-nexus

---

## 0. Hallazgos de Análisis Externo (Optimización de Contexto)

Este apartado detalla los hallazgos críticos para la optimización de tokens y la eficiencia de la ventana de contexto.

*   **Gestión de Contexto "Lazy Loading":** Carga bajo demanda. Identidad mínima (~50-100 tokens). Las reglas residen en archivos locales leídos solo cuando es necesario.
*   **Arquitectura de Delegación "Triple Check":**
    1.  `opencode.json` (Identidad)
    2.  `Command MD` (Misión/Blueprints)
    3.  `Skill Manual` (Rol/Lógica técnica)
*   **Delegación Nativa:** El campo `agent` en los comandos `.md` gestiona la creación de subtareas automáticamente.
*   **Estrategia Defensiva:** Repetición de la instrucción de lectura de Skill en el prompt de sistema y en la primera línea del comando para mitigar el sesgo de recencia.
*   **Recomendaciones v3:**
    *   MCP como índice de metadatos únicamente.
    *   Carga local de contenido de Skills desde carpetas globales.
    *   Migración de delegaciones hacia plantillas `.md` con argumentos.

---

## 1 Etapas

1. **Specify** ¿Qué? y ¿Por qué?, captura intención sin entrar en detalles técnicos. Establece el contrato el cual se medira todo el trabajo posterior.
2. **Plan** La arquitectura del cómo, se introduce el plan técnico, el stack, los modelos de datos, apis, contratos y restricciones arquitectónicas.
3. **Task** Descomposición atómica, el plan técnico se desglosa en en una lista de tareas pequeñas, accionables y revisables.
4. **Implement** Generación del código y ejecución de las tareas.
5. **Validate** Supervisa/audita que lo especificado se cumpla y en caso de que no genera un dictamen con puntos a solucionar

---

## 2 Agentes y responsabilidades

### @Maestro

**rol** Encargado de la etapa specify
**objetivo** Entender claramente la necesidad del usuario, y aplicar cambios rápidos que no requieren orquestación
**etapa** Specify
**Lo puede llamar**Solo el usuario en la interfaz principal

### @Arquitecto

**rol** Recibe la especificación creada por el maestro, y la convierte en un plan detallado y tareas atómicas.
**objetivo** El plan realizado incluye detalles con las tecnologías necesarias, skills, endpoints, etc. Genera el plan a la perfección y a su vez crea las tareas con la información necesaria para que cada agente subsecuente entienda el plan y la parte que le corresponde a la perfección.
**Lo puede llamar** @Maestro

### @Desarrollador

**rol** Encargado de la etapa de implementación, recibe las tareas atómicas y genera el código necesario para cumplir con cada una de ellas.
**objetivo** Implementar cada tarea a la perfección, siguiendo el plan establecido por el
arquitecto, y asegurando que el código generado cumple con los estándares de calidad y los objetivos establecidos.
**Lo puede llamar** @Maestro, @Consultor

### @Diseñador

**rol** Encargado de la estética y usabilidad del proyecto, recibe tareas relacionadas con el diseño, experiencia de usuario, y aspectos visuales del proyecto.
**objetivo** Asegurar que el proyecto no solo funcione bien, sino que también sea atractivo y fácil de usar para los usuarios finales, siguiendo las pautas establecidas por el arquitecto y el maestro.
**Lo puede llamar** @Maestro, @Consultor, @Desarrollador

### @Consultor

**rol** Auditar y Consultar planes complejos.
**objetivo** Asegurar que el plan técnico es sólido, factible y eficiente. Proporcionar retroalimentación experta para mejorar la calidad del plan, al finalizar las tareas realizar una auditoria para asegurar que el resultado final cumple con los estándares de calidad y los objetivos establecidos.
**Lo puede llamar** @Maestro, @Arquitecto

### @Explorador

**rol** Exploracion del proyecto
**objetivo** Inestiga donde se encuentran funciones, archivos, endpoints, etc. relacionados al proyecto, para generar un mapa de conocimiento del proyecto y así facilitar el trabajo de los demás agentes. Este agente deberia ser siempre el unico que realice tareas de exploracion por eso cualquier agente puede mandar a llamarlo
**Lo puede llamar** Todos los agentes y subagentes en cualquier momento

### @AdnManager

**rol** Administrador del ADN del proyecto
**objetivo** Encargado unico de mantener el ADN del proyecto, comandos principales, entorno de desarrollo, contenedores, devops. Para evitar actualizaciones solo el maestro puede acceder a el.
**Lo puede llamar** @Maestro

### @Consolidador

**rol** Gestor de sabiduria y memorias
**objetivo** Se encarga de analizar y consolidar toda la información generada por los agentes, para generar un repositorio de conocimiento del proyecto, que pueda ser consultado por cualquier agente para mejorar la calidad de sus respuestas y decisiones. Este agente es el encargado de mantener un registro actualizado de todo lo que se ha generado en el proyecto, para que cualquier agente pueda acceder a esta información y utilizarla para mejorar su desempeño.
**Lo puede llamar** @Maestro

---

## Tablas de la DB

### Tabla projects

**objetivo** Esta tabla almacena la información básica de cada proyecto, como su nombre, descripción, estado, etc. Es la tabla principal que relaciona a todas las demás tablas del sistema.

#### Campos

- UUID (VARCHAR, PK, NOT NULL)
- name (VARCHAR, NOT NULL) (CWD basepath del proyecto convertido en minusculas o basedirname del git repo)
- stack (TEXT) tecnologias, lenguajes, frameworks, etc.
- devops (TEXT) contenedores, pipelines, comandos, etc.

### Tabla specs

**objetivo** Esta tabla almacena las especificaciones detalladas de cada tarea, incluyendo su descripción, requisitos técnicos, criterios de aceptación, etc. Está relacionada con la tabla projects a través del campo project_id.

#### Campos

- id (INT, PK, AI, NOT NULL)
- project_id (VARCHAR, FK a projects, NOT NULL)
- title (VARCHAR, NOT NULL)
- steps (INT, NOT NULL) cantidad de pasos o tareas atómicas necesarias para completar la especificación.
- Current_step (INT, NOT NULL) paso o tarea actual en la que se encuentra el proyecto.
- porcentage (INT, NOT NULL) porcentaje de avance del proyecto, calculado en base a la cantidad de pasos completados respecto al total de pasos.
- status (ENUM('pending', 'in_progress', 'completed', 'failed'), NOT NULL) estado actual de la especificacion.
- context (TEXT) contexto general del proyecto, objetivos, resultados esperados, etc.
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

### Tabla steps_spec

**objetivo** Esta tabla almacena los pasos o tareas atómicas de cada especificación, incluyendo su descripción, requisitos técnicos, criterios de aceptación, etc. Está relacionada con la tabla specs a través del campo spec_id.

#### Campos

- id (INT, PK, AI, NOT NULL)
- spec_id (INT, FK a specs, NOT NULL)
- step_number (INT, NOT NULL) número del paso o tarea atómica dentro de la especificación.
- depends_id (INT, FK a steps_spec, NULL) referencia al paso del cual depende esta tarea, si es que existe una dependencia.
- title (VARCHAR, NOT NULL)
- meta (TEXT) objetivos y resultados esperados de esta tarea atómica.
- context (TEXT) contexto técnico específico de esta tarea, archivos relacionados, etc.
- status (ENUM('pending', 'in_progress', 'completed', 'failed'), NOT NULL) estado actual de la tarea atómica.
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

### Tabla audit_steps

**objetivo** Esta tabla almacena los resultados de las auditorias realizadas por el agente consultor, incluyendo los puntos a solucionar, recomendaciones, etc. Está relacionada con la tabla steps_spec a través del campo step_id.

#### Campos

- id (INT, PK, AI, NOT NULL)
- step_id (INT, FK a steps_spec, NOT NULL)
- title (VARCHAR, NOT NULL)
- issues_found (TEXT) puntos encontrados en la auditoria, problemas, errores, etc.
- fix_plan (TEXT) plan detallado para solucionar los puntos encontrados en la auditoria.
- fixed (BOOLEAN, DEFAULT FALSE) indica si los puntos a solucionar han sido resueltos o no.
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

### Tabla sdr_col

**objetivo** Esta tabla es una adaptacion de la bitacora col, adaptada a sdr para almacenar la sabiduria conocida en la ejecusion de tareas por SDD, busca ser una fuente de conocimiento para los agentes, y un registro de lo que se ha hecho en el proyecto, para futuras referencias y consultas.

#### Campos

- id (INT, PK, AI, NOT NULL)
- spec_id (varchar, FK a spec, NOT NULL)
- project_id (varchar, FK a project, NOT NULL)
- que_paso (TEXT) contexto tecnico y archivos
- que senti (TEXT) friccion e incertumbre tecnica, indicador numerico de riesgo del 0% al 100%.
- que_aprendi (TEXT) lecciones aprendidas, sabiduria atomica, ADR.
- que_quiero_lograr (TEXT) objetivos y resultados esperados
- que_presupongo (TEXT) asunciones tecnias y adn previo
- conceptos_clave (TEXT) stack, tecnologias, patrones, etc.
- ejemplos (TEXT) ejemplos de codigo exitosos.
- contraejemplos (TEXT) ejemplos de codigo fallidos, errores comunes, etc.
- dudas_pendientes (TEXT) preguntas sin resolver, incertidumbres, bloqueos que impiden el entendimiento, ambiguedades, etc.
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

## Estructura del proyecto

🏛️ Estructura Sko-Nexus
/
├── 🧠 mcp/ # Servidor MCP (Modular)
│ ├── index.js  
│ └── tools/  
│
├── 🚀 bin/ # CLI (sko.js)
│ ├── sko.js  
│ └── commands/  
│
├── 💎 prisma/ # SSOT: Datos y Esquemas
│ ├── schema.prisma  
│ ├── client.js # Singleton de Prisma
│ └── schemas/ # Zod Schemas vinculados a la DB
│
├── 🌐 webapp/ # UI (Next.js Aislado)
│ ├── src/app/
│ └── ...
│
├── 📂 assets/ # Conocimiento (No Código)
│ ├── skills/  
│ ├── protocols/  
│ ├── subagents/  
│ └── maestros/  
│
├── 🐳 docker/ # INFRAESTRUCTURA (Docker Registry)
│ ├── mcp.Dockerfile # Dockerfile optimizado para el servidor MCP
│ ├── webapp.Dockerfile # Dockerfile para Next.js (Standalone mode)
│ └── mariadb/ # Configs de DB y scripts .sql de inicio
│
├── ⚙️ docker-compose.yml # ORQUESTADOR GLOBAL
├── 📄 .env # Variables de entorno compartidas
└── 📦 package.json # Raíz: Dependencias globales y scripts de orquestación
